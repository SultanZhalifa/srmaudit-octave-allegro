/** Activity log writer — prepends entries and caps the list length. */
import type { ActivityColor } from '@/core/types';
import { ACTIVITY_LOG_LIMIT } from '@/core/constants';
import { timestamp } from '@/core/utils';
import { backend } from './backend';

export function logActivity(action: string, detail: string, color: ActivityColor = 'accent'): void {
  if (!backend.user) return;
  const log = backend.repo.get('activityLog');
  log.unshift({ action, detail, color, time: timestamp() });
  if (log.length > ACTIVITY_LOG_LIMIT) log.length = ACTIVITY_LOG_LIMIT;
  backend.repo.set('activityLog', log);
}
