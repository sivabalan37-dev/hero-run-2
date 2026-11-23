/** Nobi's aerial special: a short, directional burst that complements glide and air-jump. */
export function applyNobiAirDash(body) {
  if (!body || body.grounded || body.airDashTimer > 0) return false;
  const facing = Math.sign(body.facing || 1);
  body.facing = facing;
  body.airDashSpeed = 12;
  body.airDashTimer = 0.18;
  body.vx = facing * body.airDashSpeed;
  body.vy = Math.max(body.vy, 2.4);
  return true;
}
