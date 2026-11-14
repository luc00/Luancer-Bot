# Specifica di Sicurezza Zero-Trust Firestore — Luancer & Co.

## 1. Invarianti dei Dati
1. **Isolamento PII (Split Collection)**: Nessun dato personale sensibile (`email`, `vatNumber`) è archiviato nella radice pubblica `/users/{userId}`. I campi PII vivono esclusivamente in `/users/{userId}/private/info` e possono essere letti o modificati soltanto dal proprietario verificato (`request.auth.uid == userId && request.auth.token.email_verified == true`).
2. **Integrità dell'Identità e degli ID**: Ogni `userId`, `docId` e `botConfigId` deve soddisfare `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128` caratteri). I campi `uid` e `ownerId` nei documenti devono corrispondere esattamente a `request.auth.uid` alla creazione e restare immutabili negli aggiornamenti.
3. **Integrità Temporale (`request.time`)**: I campi `createdAt` e `updatedAt` devono coincidere con `request.time` alla creazione; negli aggiornamenti `createdAt` è immutabile e `updatedAt == request.time`.
4. **Master Gate Relazionale sulle Sottocollezioni**: Le scritture su `/users/{userId}/botConfigs/{botConfigId}` verificano l'esistenza del documento padre `/users/{userId}` con `exists(...)` e `get(...).data.uid == request.auth.uid`.
5. **Validazione Stretta degli Aggiornamenti (`Action-Based`)**: Tutte le regole `allow update` iniziano con `isValid[Entity](incoming())` e limitano i campi modificabili tramite `affectedKeys().hasOnly(...)`.

## 2. "Dirty Dozen" — 12 Payload Avversari
1. **P1 (Unauthenticated Write)**: Tentativo di scrittura su `/users/u1/botConfigs/b1` con `auth = null`. Atteso: `PERMISSION_DENIED`.
2. **P2 (Unverified Email Spoof)**: Utente autenticato su `/users/u1` con `email_verified: false`. Atteso: `PERMISSION_DENIED`.
3. **P3 (Cross-Tenant Owner Hijack)**: Utente `u2` tenta di creare `/users/u1/botConfigs/b1` impostando `ownerId: 'u2'`. Atteso: `PERMISSION_DENIED`.
4. **P4 (Identity Spoofing in Body)**: Utente `u1` tenta di creare `/users/u1/botConfigs/b1` con `ownerId: 'u999'`. Atteso: `PERMISSION_DENIED`.
5. **P5 (Shadow Ghost Field Injection)**: Utente `u1` include il campo extra non autorizzato `isAdmin: true` in `UserPublicProfile`. Atteso: `PERMISSION_DENIED`.
6. **P6 (PII Cross-User Read)**: Utente `u2` tenta `get()` su `/users/u1/private/info`. Atteso: `PERMISSION_DENIED`.
7. **P7 (Blanket List Scraping)**: Utente `u2` tenta una `list` query su `/users/u1/botConfigs` o `/users`. Atteso: `PERMISSION_DENIED`.
8. **P8 (ID Poisoning / 1.5KB Junk ID)**: Utente `u1` tenta di scrivere su un ID documento di 500 caratteri o contenente caratteri `/` o `$`. Atteso: `PERMISSION_DENIED`.
9. **P9 (Oversized String DoS / Denial of Wallet)**: Utente `u1` invia `customDirectives` di 5.000 caratteri (oltre limite `2000`). Atteso: `PERMISSION_DENIED`.
10. **P10 (Unbounded Array Injection)**: Utente `u1` invia `selectedEmployees` con 8 elementi (oltre limite `6`) o con un elemento numerico `[123]`. Atteso: `PERMISSION_DENIED`.
11. **P11 (Client Timestamp Forgery)**: Utente `u1` invia `createdAt` fittizio nel passato invece di `serverTimestamp()` (`request.time`). Atteso: `PERMISSION_DENIED`.
12. **P12 (Immutable Field & Terminal Lock Bypass)**: Utente `u1` tenta di cambiare `ownerId` o `bundleType` durante un `update` su `botConfigs`. Atteso: `PERMISSION_DENIED`.
