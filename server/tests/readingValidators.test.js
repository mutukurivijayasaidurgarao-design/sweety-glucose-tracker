import test from 'node:test';
import assert from 'node:assert/strict';
import { readingSchema } from '../src/validators/readingValidators.js';

const valid = { readingDate: '2026-11-27', timeSlot: 'morning_fasting', glucoseValue: 105 };

test('accepts a valid glucose reading', () => {
  assert.equal(readingSchema.safeParse(valid).success, true);
});

test('rejects values outside 40–600 and decimal values', () => {
  assert.equal(readingSchema.safeParse({ ...valid, glucoseValue: 39 }).success, false);
  assert.equal(readingSchema.safeParse({ ...valid, glucoseValue: 601 }).success, false);
  assert.equal(readingSchema.safeParse({ ...valid, glucoseValue: 100.5 }).success, false);
});

test('rejects unknown time slots', () => {
  assert.equal(readingSchema.safeParse({ ...valid, timeSlot: 'bedtime' }).success, false);
});

test('rejects future dates', () => {
  assert.equal(readingSchema.safeParse({ ...valid, readingDate: '2999-01-01' }).success, false);
});
