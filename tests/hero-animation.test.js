import test from 'node:test';
import assert from 'node:assert/strict';
import { getAttackPose } from '../src/adventure/HeroAnimation.js';

test('attack pose eases from neutral to a forward punch', () => {
  assert.deepEqual(getAttackPose(0), {
    rightArmRotation: 0, leftArmRotation: 0, bodyLean: 0,
  });
  const pose = getAttackPose(1);
  assert.ok(pose.rightArmRotation < -1.2);
  assert.ok(pose.leftArmRotation > 0.2);
  assert.ok(pose.bodyLean > 0.05);
});

test('attack pose clamps invalid and out-of-range blend values', () => {
  assert.deepEqual(getAttackPose(-2), getAttackPose(0));
  assert.deepEqual(getAttackPose(5), getAttackPose(1));
  assert.deepEqual(getAttackPose(Number.NaN), getAttackPose(0));
});
