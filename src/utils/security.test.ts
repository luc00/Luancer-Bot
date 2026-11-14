import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSlidingWindowLimiter,
  validateBotPurchaseInput,
  sanitizeBotPatchInput,
  resolveAuthoritativePlanMonthlyPrice,
} from './security.ts';
import {
  ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR,
  ALL_IN_ONE_BOT_MONTHLY_EUR,
} from './botEngine.ts';

test('createSlidingWindowLimiter enforces maxRequests within window and resets after expiry', () => {
  const limiter = createSlidingWindowLimiter({ maxRequests: 2, windowMs: 10_000 });

  const first = limiter.check('1.2.3.4', 1000);
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);

  const second = limiter.check('1.2.3.4', 2000);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);

  const third = limiter.check('1.2.3.4', 3000);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSeconds >= 1);

  // Other IP unaffected
  assert.equal(limiter.check('5.6.7.8', 3000).allowed, true);

  // After window expires, IP is allowed again
  assert.equal(limiter.check('1.2.3.4', 12_000).allowed, true);
});

test('validateBotPurchaseInput ignores forged client priceEur and enforces server-side pricing', () => {
  const result = validateBotPurchaseInput({
    botCode: 'LUANCER-6X1',
    name: 'Bot Test Azienda',
    bundleType: 'all_in_one',
    billingCycle: 'annual',
    priceEur: 1, // Malicious client attempting to pay €1
    autonomyLevel: 'piena-autonomia',
    finishId: 'brushed_gold',
    selectedEmployees: ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6'],
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.authoritativePriceEur, ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR);
  }

  const monthlyAllInOne = validateBotPurchaseInput({
    name: 'Bot Mensile',
    bundleType: 'all_in_one',
    billingCycle: 'monthly',
    priceEur: -50,
    selectedEmployees: ['emp-1'],
  });
  assert.equal(monthlyAllInOne.valid, true);
  if (monthlyAllInOne.valid) {
    assert.equal(monthlyAllInOne.data.authoritativePriceEur, ALL_IN_ONE_BOT_MONTHLY_EUR);
  }
});

test('validateBotPurchaseInput rejects invalid employees and missing names', () => {
  const missingName = validateBotPurchaseInput({
    name: ' ',
    selectedEmployees: ['emp-1'],
  });
  assert.equal(missingName.valid, false);

  const badEmployees = validateBotPurchaseInput({
    name: 'Valid Bot',
    selectedEmployees: ['emp-999', '__proto__'],
  });
  assert.equal(badEmployees.valid, false);
});

test('sanitizeBotPatchInput strips unknown or invalid enum fields', () => {
  const clean = sanitizeBotPatchInput({
    name: 'Nuovo Nome',
    status: 'hacked_status',
    autonomyLevel: 'invalid_level',
    finishId: 'charcoal_titanium',
    selectedEmployees: ['emp-1', 'emp-bad', 'emp-1'],
    extraShadowField: true,
  });

  assert.equal(clean.name, 'Nuovo Nome');
  assert.equal(clean.status, undefined);
  assert.equal(clean.autonomyLevel, undefined);
  assert.equal(clean.finishId, 'charcoal_titanium');
  assert.deepEqual(clean.selectedEmployees, ['emp-1']);
  assert.equal((clean as Record<string, unknown>).extraShadowField, undefined);
});

test('resolveAuthoritativePlanMonthlyPrice returns exact catalog rate', () => {
  assert.equal(resolveAuthoritativePlanMonthlyPrice('atelier', 'annual'), 199);
  assert.equal(resolveAuthoritativePlanMonthlyPrice('atelier', 'monthly'), 249);
  assert.equal(resolveAuthoritativePlanMonthlyPrice('nonexistent', 'annual'), null);
});
