export const PHYSICS = Object.freeze({
  moveSpeed: 7.2,
  acceleration: 42,
  friction: 48,
  gravity: 28,
  jumpSpeed: 10.8,
  coyoteSeconds: 0.11,
  jumpBufferSeconds: 0.14,
  maxFallSpeed: 22,
});

export function createBody(x = 0, y = 0) {
  return {
    x, y, vx: 0, vy: 0,
    width: 0.78, height: 1.9, standingHeight: 1.9, crouchHeight: 1.12, crouching: false,
    slideTimer: 0, slideDirection: 0, slideSpeed: 0,
    grounded: false,
    coyoteTimer: 0,
    jumpBuffer: 0,
    facing: 1,
    maxAirJumps: 0,
    airJumpsRemaining: 0,
    airDashTimer: 0,
    airDashSpeed: 12,
    airDashDirection: 0,
    wallContactDirection: 0,
    wallSliding: false,
  };
}

const approach = (value, target, amount) => {
  if (value < target) return Math.min(value + amount, target);
  return Math.max(value - amount, target);
};

function overlapsX(body, platform) {
  return body.x + body.width / 2 > platform.x - platform.width / 2 &&
    body.x - body.width / 2 < platform.x + platform.width / 2;
}

function canFitHeight(body, height, platforms) {
  const top = body.y + height;
  return !platforms.some(platform =>
    overlapsX(body, platform) &&
    body.y < platform.y + platform.height - 0.02 &&
    top > platform.y + 0.02
  );
}

/** Fixed-step AABB platform physics. Body y is the character's feet. */
export function stepBody(body, input, platforms, dt, bounds = null, tuning = null) {
  if (!(dt > 0) || dt > 0.05) throw new RangeError('Physics dt must be between 0 and 0.05 seconds');

  const moveSpeed = Number.isFinite(tuning?.moveSpeed) ? Math.max(0, Math.min(20, tuning.moveSpeed)) : PHYSICS.moveSpeed;
  const acceleration = Number.isFinite(tuning?.acceleration) ? Math.max(0, Math.min(200, tuning.acceleration)) : PHYSICS.acceleration;
  const jumpSpeed = Number.isFinite(tuning?.jumpSpeed) ? Math.max(0, Math.min(20, tuning.jumpSpeed)) : PHYSICS.jumpSpeed;

  const wasCrouching = Boolean(body.crouching);
  if (input.crouch) {
    body.crouching = true;
    body.height = body.crouchHeight || 1.12;
  } else if (body.crouching && canFitHeight(body, body.standingHeight || 1.9, platforms)) {
    body.crouching = false;
    body.height = body.standingHeight || 1.9;
  }
  if (body.crouching && !wasCrouching && body.grounded && Math.abs(body.vx) > 3.2) {
    body.slideTimer = 0.38;
    body.slideDirection = Math.sign(body.vx);
    body.slideSpeed = Math.min(12.5, Math.max(6.5, Math.abs(body.vx) * 1.35));
  }
  if (input.jumpPressed) body.jumpBuffer = PHYSICS.jumpBufferSeconds;
  else body.jumpBuffer = Math.max(0, body.jumpBuffer - dt);

  if (body.grounded) body.coyoteTimer = PHYSICS.coyoteSeconds;
  else body.coyoteTimer = Math.max(0, body.coyoteTimer - dt);

  const move = Math.max(-1, Math.min(1, input.move || 0));
  const dashActive = body.airDashTimer > 0;
  if (dashActive) {
    const dashDirection = Math.sign(body.airDashDirection || body.facing || 1);
    body.facing = dashDirection;
    body.airDashTimer = Math.max(0, body.airDashTimer - dt);
    body.vx = dashDirection * Math.max(moveSpeed, body.airDashSpeed || 12);
  } else {
    body.airDashDirection = 0;
    if (move && body.slideTimer <= 0) body.facing = Math.sign(move);
    if (body.slideTimer > 0 && body.grounded) {
      body.vx = body.slideDirection * body.slideSpeed * (body.slideTimer / 0.38);
      body.slideTimer = Math.max(0, body.slideTimer - dt);
      if (body.slideTimer === 0) body.slideSpeed = 0;
    } else {
      body.slideTimer = 0;
      const sprintMultiplier = input.sprint && move !== 0 && !body.crouching ? 1.35 : 1;
      const crouchMultiplier = body.crouching ? 0.55 : 1;
      const targetSpeed = move * Math.min(20, moveSpeed * sprintMultiplier * crouchMultiplier);
      body.vx = approach(body.vx, targetSpeed, (move ? acceleration : PHYSICS.friction) * dt);
    }
  }

  // Only solid-sided blocks stop horizontal motion; raised platforms are one-way ledges.
  const oldLeft = body.x - body.width / 2;
  const oldRight = body.x + body.width / 2;
  body.x += body.vx * dt;
  for (const platform of platforms) {
    if (!platform.solidSides) continue;
    const verticalOverlap = body.y < platform.y + platform.height &&
      body.y + body.height > platform.y;
    if (!verticalOverlap) continue;
    const left = platform.x - platform.width / 2;
    const right = platform.x + platform.width / 2;
    const nextLeft = body.x - body.width / 2;
    const nextRight = body.x + body.width / 2;
    if (body.vx > 0 && oldRight <= left + 0.03 && nextRight > left) {
      body.x = left - body.width / 2;
      body.vx = 0;
    } else if (body.vx < 0 && oldLeft >= right - 0.03 && nextLeft < right) {
      body.x = right + body.width / 2;
      body.vx = 0;
    }
  }
  if (bounds) {
    const minX = bounds.minX + body.width / 2;
    const maxX = bounds.maxX - body.width / 2;
    if (body.x < minX) { body.x = minX; body.vx = Math.max(0, body.vx); }
    if (body.x > maxX) { body.x = maxX; body.vx = Math.min(0, body.vx); }
  }

  body.wallContactDirection = 0;
  for (const platform of platforms) {
    if (!platform.solidSides) continue;
    const verticalOverlap = body.y < platform.y + platform.height &&
      body.y + body.height > platform.y;
    if (!verticalOverlap) continue;
    const wallLeft = platform.x - platform.width / 2;
    const wallRight = platform.x + platform.width / 2;
    const bodyLeft = body.x - body.width / 2;
    const bodyRight = body.x + body.width / 2;
    if (Math.abs(bodyRight - wallLeft) <= 0.04) body.wallContactDirection = 1;
    else if (Math.abs(bodyLeft - wallRight) <= 0.04) body.wallContactDirection = -1;
  }

  const wallJump = Boolean(input.jumpPressed && !body.grounded && body.wallContactDirection);
  if (wallJump) {
    body.vx = -body.wallContactDirection * Math.min(12, Math.max(7.5, moveSpeed * 1.15));
    body.vy = jumpSpeed * 1.05;
    body.facing = -body.wallContactDirection;
    body.jumpBuffer = 0;
    body.coyoteTimer = 0;
    body.airDashTimer = 0;
    body.airDashDirection = 0;
  }

  const previousBottom = body.y;
  const previousTop = body.y + body.height;
  const gliding = Boolean(input.glide && !body.grounded && body.vy < 0);
  body.wallSliding = Boolean(
    !body.grounded &&
    body.wallContactDirection &&
    move * body.wallContactDirection > 0 &&
    body.vy < 0 &&
    !wallJump
  );
  const gravity = gliding ? PHYSICS.gravity * 0.32 : PHYSICS.gravity;
  const fallLimit = gliding ? 5.2 : body.wallSliding ? 5.8 : PHYSICS.maxFallSpeed;
  body.vy = Math.max(-fallLimit, body.vy - gravity * dt);
  body.y += body.vy * dt;
  body.grounded = false;

  for (const platform of platforms) {
    if (!overlapsX(body, platform)) continue;
    const top = platform.y + platform.height;
    const bottom = platform.y;
    const nextBottom = body.y;
    const nextTop = body.y + body.height;
    if (body.vy <= 0 && previousBottom >= top - 0.035 && nextBottom <= top) {
      body.y = top;
      body.vy = 0;
      body.grounded = true;
    } else if (body.vy > 0 && previousTop <= bottom + 0.035 && nextTop >= bottom) {
      body.y = bottom - body.height;
      body.vy = 0;
    }
  }

  if (body.grounded) body.airJumpsRemaining = Math.max(0, body.maxAirJumps || 0);
  if (body.jumpBuffer > 0 && (body.grounded || body.coyoteTimer > 0)) {
    body.vy = jumpSpeed;
    body.grounded = false;
    body.coyoteTimer = 0;
    body.jumpBuffer = 0;
    body.airJumpsRemaining = Math.max(0, body.maxAirJumps || 0);
  } else if (body.jumpBuffer > 0 && body.airJumpsRemaining > 0) {
    body.vy = jumpSpeed * 0.92;
    body.jumpBuffer = 0;
    body.airJumpsRemaining--;
    body.airDashTimer = 0;
    body.airDashDirection = 0;
  }
  return body;
}
