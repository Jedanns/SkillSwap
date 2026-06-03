// XP required to reach level N: (N-1) * N * 50
// L1=0, L2=100, L3=300, L4=600, L5=1000, L10=4500, L20=19000
export function xpForLevel(n: number): number {
  return (n - 1) * n * 50;
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export function getXpToNextLevel(xp: number): number {
  const currentLevel = getLevelFromXp(xp);
  return xpForLevel(currentLevel + 1) - xp;
}
