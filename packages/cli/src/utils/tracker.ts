import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { TrackerData } from '../types';
import { TRACKER_PATH } from '../types';

// 获取 tracker 文件路径（支持测试时的动态路径）
const getTrackerPath = () => process.env.OMO_QUOTA_TRACKER_PATH || TRACKER_PATH;

export function loadTracker(): TrackerData {
  const trackerPath = getTrackerPath();

  if (!existsSync(trackerPath)) {
    return {
      providers: {},
      currentStrategy: 'balanced',
    };
  }

  try {
    const data = readFileSync(trackerPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取追踪文件失败，使用默认值');
    return {
      providers: {},
      currentStrategy: 'balanced',
    };
  }
}

export function saveTracker(data: TrackerData): void {
  const trackerPath = getTrackerPath();

  try {
    // 确保目录存在
    const dir = trackerPath.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(trackerPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存追踪文件失败:', error);
    process.exit(1);
  }
}

export function calculateNextReset(interval: string): string {
  const now = new Date();
  const hours = interval === '5h' ? 5 : 24;
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function getTimeUntilReset(nextReset: string): string {
  const now = new Date();
  const reset = new Date(nextReset);
  const diff = reset.getTime() - now.getTime();

  if (diff < 0) return '已过期';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m 后`;
}
