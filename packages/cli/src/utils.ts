export function formatTimeRemaining(nextResetTime: string): string {
  const now = new Date();
  const nextReset = new Date(nextResetTime);
  const diff = nextReset.getTime() - now.getTime();

  if (diff <= 0) {
    return '已过期';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m 后`;
}

export function formatPercentage(used: number, limit: number): number {
  return Math.round((used / limit) * 100);
}

export function getStatusIcon(percentage: number): string {
  if (percentage < 50) return '✓';
  if (percentage < 80) return '⚠';
  return '✗';
}
