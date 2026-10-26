import test from 'node:test';
import assert from 'node:assert/strict';
import { passBalance } from '../public/product-view.js';

test('pass detail balance preserves cancellation and archived-history semantics', () => {
  const visits = [
    { pass: 'pass', status: 'reserved' },
    { pass: 'pass', status: 'attended' },
    { pass: 'pass', status: 'attended', archived: true },
    { pass: 'pass', status: 'cancelled' },
    { pass: 'other', status: 'reserved' },
  ];
  assert.deepEqual(passBalance({ id: 'pass', units: 8 }, visits), { free: 5, reserved: 1, attended: 2 });
  assert.deepEqual(passBalance({ id: 'other', units: 1 }, visits), { free: 0, reserved: 1, attended: 0 });
});
