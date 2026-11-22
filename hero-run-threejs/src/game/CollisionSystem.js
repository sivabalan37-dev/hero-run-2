export class CollisionSystem {
  check(player, obstacles, coins, powerups, score, onEvent = () => {}) {
    const p = player.group.position;
    for (const item of obstacles.items) {
      const entity = item.entity, g = entity.group;
      if (item.hit || Math.abs(g.position.z) > (item.type === 'enemy' ? 2.1 : 0.95) || Math.abs(p.x - g.position.x) > 1.12) continue;
      if (item.type === 'enemy') {
        if ((player.attackPulse || player.specialPulse) && !entity.defeated) {
          entity.defeated = true; score.addKill(); onEvent('enemy', g.position.clone());
        } else if (Math.abs(g.position.z) < 0.9 && !entity.defeated) {
          item.hit = true; if (player.damage()) onEvent('hit');
        }
        continue;
      }
      const clears = entity.type === 'spikes' ? p.y > 0.82 : entity.type === 'log' ? player.slideTimer > 0 : p.y > 1.22;
      item.hit = true; entity.cleared = true;
      if (clears) onEvent('clear');
      else if (player.damage()) onEvent('hit');
    }
    for (const item of coins.items) {
      if (item.taken) continue;
      const dx = Math.abs(p.x - item.group.position.x), dz = Math.abs(item.group.position.z);
      const magnet = player.magnetTimer > 0 && dx < 5.5;
      const vertical = p.y + 2.35 > item.group.position.y && p.y < item.group.position.y + 1.1;
      if (dz < 1.15 && (dx < 1.12 || magnet) && vertical) {
        item.taken = true;
        if (item.type === 'coin') { score.addCoin(); onEvent('coin'); }
        else if (item.type === 'shard') { score.addShard(); onEvent('shard'); }
        else if (item.type === 'health') { player.heal(1); onEvent('health'); }
      }
    }
    for (const item of powerups.items) {
      if (!item.taken && Math.abs(p.x - item.group.position.x) < 1.15 && Math.abs(item.group.position.z) < 1.15) {
        item.taken = true; player.activate(item.type); onEvent('power', item.type);
      }
    }
  }
}