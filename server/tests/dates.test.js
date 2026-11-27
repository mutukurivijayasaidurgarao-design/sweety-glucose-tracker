import test from 'node:test';
import assert from 'node:assert/strict';
import { getReportRange, isValidDateString } from '../src/utils/dates.js';

test('accepts valid calendar dates and rejects impossible dates', () => {
  assert.equal(isValidDateString('2026-11-27'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('27-11-2026'), false);
});

test('daily report range is the selected day', () => {
  assert.deepEqual(getReportRange('daily', '2026-10-15'), {
    startDate: '2026-10-15', endDate: '2026-10-15',
  });
});

test('month-to-date starts on the first day of selected month', () => {
  assert.deepEqual(getReportRange('month-to-date', '2026-10-15'), {
    startDate: '2026-10-01', endDate: '2026-10-15',
  });
});

test('monthly report returns the complete previous month, including year boundary', () => {
  assert.deepEqual(getReportRange('monthly', '2026-01-15'), {
    startDate: '2025-12-01', endDate: '2025-12-31',
  });
});
