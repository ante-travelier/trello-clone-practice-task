export default function DueDateBadge({ date }) {
  if (!date) return null;

  const dueDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffMs = dueDateNormalized.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ';

  if (diffDays < 0) {
    className += 'bg-red-500/20 text-red-400 border border-red-500/30';
  } else if (diffDays === 0) {
    className += 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  } else {
    className += 'bg-gray-700/50 text-gray-400 border border-gray-600/30';
  }

  const formatted = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <span className={className}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {formatted}
    </span>
  );
}
