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
    width: 0.78, height: 1.9,
    grounded: false,
    coyoteTimer: 0,
    jumpBuffer: 0,
    facing: 1,
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

/** Fixed-step AABB platform physics. Body y is the character's feet. */
export function stepBody(body, input, platforms, dt, bounds = null) {
  if (!(dt > 0) || dt > 0.05) throw new RangeError('Physics dt must be between 0 and 0.05 seconds');

  if (input.jumpPressed) body.jumpBuffer = PHYSICS.jumpBufferSeconds;
  else body.jumpBuffer = Math.max(0, body.jumpBuffer - dt);

  if (body.grounded) body.coyoteTimer = PHYSICS.coyoteSeconds;
  else body.coyoteTimer = Math.max(0, body.coyoteTimer - dt);

  const move = Math.max(-1, Math.min(1, input.move || 0));
  if (move) body.facing = Math.sign(move);
  const targetSpeed = move * PHYSICS.moveSpeed;
  body.vx = approach(body.vx, targetSpeed, (move ? PHYSICS.acceleration : PHYSICS.friction) * dt);

  const oldLeft = body.x - body.width / 2;
  const oldRight = body.x + body.width / 2;
  body.x += body.vx * dt;
  for (const platform of platforms) {
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

  const previousBottom = body.y;
  const previousTop = body.y + body.height;
  body.vy = Math.max(-PHYSICS.maxFallSpeed, body.vy - PHYSICS.gravity * dt);
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

  if (body.jumpBuffer > 0 && (body.grounded || body.coyoteTimer > 0)) {
    body.vy = PHYSICS.jumpSpeed;
    body.grounded = false;
    body.coyoteTimer = 0;
    body.jumpBuffer = 0;
  }
  return body;
}
