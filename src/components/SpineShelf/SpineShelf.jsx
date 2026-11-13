/**
 * SpineShelf — the recently-shelved projects as book spines on a shelf.
 * Hover pulls a spine out; click opens it.
 */
import { REASONS, daysIdle } from '../../lib/store.js';
import './SpineShelf.css';

const FACES = ['#EEE3B0', '#FFE5D9', '#FFCAD4', '#F4ACB7', '#D8E2DC'];
const HEIGHTS = [196, 218, 178, 208, 188];

export default function SpineShelf({ projects, onSelect }) {
  return (
    <div className="ss-wrap" role="list" aria-label="Recently shelved — pick a book">
      <div className="ss-row">
        {projects.map((p, i) => {
          const reason = REASONS.find((r) => r.key === p.reason);
          return (
            <button
              key={p.id}
              type="button"
              role="listitem"
              className="spine"
              style={{
                '--face': FACES[i % FACES.length],
                '--h': `${HEIGHTS[i % HEIGHTS.length]}px`,
                '--d': `${i * 0.09}s`,
                '--tilt': `${(i % 2 ? 1 : -1) * (0.7 + (i % 3) * 0.6)}deg`
              }}
              onClick={() => onSelect(p)}
              aria-label={`${p.name}, ${reason?.label || 'shelved'}, ${p.completion}% complete`}
            >
              <span className="spine-dot" style={{ background: reason?.color || '#D8E2DC' }} />
              <span className="spine-title">{p.name}</span>
              <span className="spine-band" />
              <span className="spine-foot">
                <span className="spine-pct">{p.completion}%</span>
                <span className="spine-idle">{daysIdle(p)}d</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="shelf-plank" aria-hidden="true" />
    </div>
  );
}
