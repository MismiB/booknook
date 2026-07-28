import { genreInfo } from '../genres';
import './GoalRing.css';

const SIZE = 220;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

export default function GoalRing({ readBooks, goal }) {
  const readCount = readBooks.length;
  const segments = Math.max(goal, 1);
  const segLen = CIRCUMFERENCE / segments;
  const gap = segLen > 10 ? 3 : 0;
  const remaining = Math.max(goal - readCount, 0);
  const overflow = Math.max(readCount - goal, 0);

  return (
    <div className="goal-ring">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {Array.from({ length: segments }).map((_, i) => {
            const book = readBooks[i];
            const color = book ? genreInfo(book.genre).color : 'var(--edge)';
            return (
              <circle
                key={i}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap={gap > 0 ? 'round' : 'butt'}
                strokeDasharray={`${Math.max(segLen - gap, 0)} ${CIRCUMFERENCE}`}
                strokeDashoffset={-i * segLen}
              />
            );
          })}
        </g>
      </svg>
      <div className="goal-ring-center">
        <div className="goal-ring-num">{readCount}</div>
        <div className="goal-ring-of">of {goal} book{goal === 1 ? '' : 's'}</div>
        <div className="goal-ring-remaining">
          {remaining > 0
            ? `${remaining} to go`
            : overflow > 0
              ? `+${overflow} beyond goal`
              : 'Goal reached'}
        </div>
      </div>
    </div>
  );
}
