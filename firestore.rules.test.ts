import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * Security Rule Contract & Dirty Dozen Structural Verification
 * Validates that firestore.rules contains all required Zero-Trust guards,
 * entity blueprints, split PII isolation, and size/type boundaries.
 */
const rulesPath = fs.existsSync('firestore.rules') ? 'firestore.rules' : 'DRAFT_firestore.rules';
const rulesText = fs.readFileSync(rulesPath, 'utf8');

test('Global default-deny safety net is present at root', () => {
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
});

test('P1 & P2: Verified email and auth gates enforced', () => {
  assert.match(rulesText, /request\.auth != null/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
});

test('P3, P4 & P12: Identity integrity and immutable ownerId/createdAt enforced', () => {
  assert.match(rulesText, /incoming\(\)\.ownerId == existing\(\)\.ownerId/);
  assert.match(rulesText, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
  assert.match(rulesText, /incoming\(\)\.uid == existing\(\)\.uid/);
});

test('P5: Strict hasAll & hasOnly checks prevent ghost fields', () => {
  assert.match(rulesText, /data\.keys\(\)\.hasAll/);
  assert.match(rulesText, /data\.keys\(\)\.hasOnly/);
  assert.match(rulesText, /affectedKeys\(\)\.hasOnly/);
});

test('P6: PII email isolated in /users/{userId}/private/{docId}', () => {
  assert.match(rulesText, /match \/private\/\{docId\}/);
  const publicFnMatch = rulesText.match(/function isValidUserPublicProfile\([^)]*\)\s*\{[^}]*\}/);
  assert.ok(publicFnMatch, 'isValidUserPublicProfile helper must exist');
  assert.ok(!publicFnMatch[0].includes("'email'"), 'Public profile must not store email');
});

test('P7: Secure list queries enforce resource.data.ownerId check without get()', () => {
  assert.match(rulesText, /allow list: if isOwner\(userId\) && resource\.data\.ownerId == request\.auth\.uid;/);
});

test('P8, P9 & P10: Path ID regex, string sizes, and bounded list checks present', () => {
  assert.match(rulesText, /isValidId\(botConfigId\)/);
  assert.match(rulesText, /data\.customDirectives\.size\(\) <= 2000/);
  assert.match(rulesText, /data\.selectedEmployees\.size\(\) <= 6/);
  assert.match(rulesText, /data\.selectedEmployees\.hasOnly\(/);
});

test('P11: Temporal integrity enforces request.time on create and update', () => {
  assert.match(rulesText, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
});
