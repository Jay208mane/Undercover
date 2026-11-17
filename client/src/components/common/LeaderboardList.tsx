import type { AllTimeLeaderboard, CurrentGameLeaderboard } from '../../game/local/leaderboardStorage';

type LeaderboardRow =
  | { playerId: string; name: string; totalPoints: number; pointsEarned: number }
  | { playerId: string; name: string; pointsEarned: number };

export function LeaderboardList({
  rows,
  emptyMessage,
  totalLabel,
  earnedLabel,
}: {
  rows: LeaderboardRow[];
  emptyMessage: string;
  totalLabel: string;
  earnedLabel: string;
}) {
  const sorted = [...rows].sort(
    (left, right) =>
      ('totalPoints' in left && 'totalPoints' in right
        ? right.totalPoints - left.totalPoints
        : right.pointsEarned - left.pointsEarned) ||
      left.name.localeCompare(right.name)
  );

  if (sorted.length === 0) {
    return <p style={emptyStyle}>{emptyMessage}</p>;
  }

  return (
    <ol style={listStyle}>
      {sorted.map((player, index) => (
        <li key={player.playerId} style={rowStyle}>
          <span style={rankStyle}>{index + 1}</span>
          <span aria-hidden style={avatarStyle}>{getInitials(player.name)}</span>
          <span style={nameStyle}>{player.name}</span>
          <span style={scoreStyle}>
            {'totalPoints' in player && (
              <span>{player.totalPoints} <small>{totalLabel}</small></span>
            )}
            <span style={earnedStyle}>{player.pointsEarned} <small>{earnedLabel}</small></span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function toAllTimeRows(
  board: AllTimeLeaderboard,
  currentGame: CurrentGameLeaderboard | null
) {
  const earnedById = new Map(
    currentGame?.entries.map((player) => [player.playerId, player.pointsEarned]) ?? []
  );
  return board.players.map((player) => ({
    ...player,
    pointsEarned: earnedById.get(player.playerId) ?? 0,
  }));
}

export function toCurrentGameRows(board: CurrentGameLeaderboard | null) {
  return board?.entries ?? [];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words[0]?.[0]?.toLocaleUpperCase() ?? '?';
  return `${words[0][0]}${words[words.length - 1][0]}`.toLocaleUpperCase();
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: 0,
  margin: 0,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  minWidth: 0,
  padding: '0.65rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-card)',
};

const rankStyle: React.CSSProperties = {
  width: '1.4rem',
  flexShrink: 0,
  color: 'var(--color-text-dim)',
  fontWeight: 800,
  textAlign: 'center',
  fontSize: '0.75rem',
};

const avatarStyle: React.CSSProperties = {
  width: '2.25rem',
  height: '2.25rem',
  flexShrink: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(145deg, #7655df, #4e73df)',
  color: '#fff',
  fontWeight: 800,
  fontSize: '0.75rem',
};

const nameStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 650,
};

const scoreStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.12rem',
  flexShrink: 0,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
};

const earnedStyle: React.CSSProperties = {
  color: 'var(--color-accent-soft)',
  fontSize: '0.75rem',
};

const emptyStyle: React.CSSProperties = {
  padding: '1.25rem 1rem',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  fontSize: '0.875rem',
};
