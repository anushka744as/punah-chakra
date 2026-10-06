// Notifications are inserted with `time_ago` always defaulting to the literal string
// 'Just now' at the DB level (see src/migrations/001_initial_schema.sql) and nothing ever
// updates it afterward — so every notification shows "Just now" forever regardless of when
// it was actually created. This computes a real relative time from `created_at` instead.
export const formatTimeAgo = (createdAt: string): string => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 'Just now';

  const diffMs = Date.now() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;

  return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
