import './CardSpread.css';

/**
 * CardSpread — a fanned deck of shelved projects.
 * Five cards rest overlapped; hovering spreads them into a fan.
 * (Motion & structure from the provided source; content = our projects.)
 */
const DEFAULT_PROJECTS = [
  { name: 'Study Planner', tag: 'No time', tagKey: 'time', meta: '60% done · paused 34d' },
  { name: 'ML Notes Search', tag: 'Too complex', tagKey: 'complex', meta: '85% done · paused 8d' },
  { name: 'Game Jam “Lumen”', tag: 'Lost interest', tagKey: 'lost', meta: '35% done · paused 3d' },
  { name: 'Dev Blog', tag: 'Moved on', tagKey: 'moved', meta: '70% done · revived' },
  { name: 'Expense Tracker', tag: 'No time', tagKey: 'time', meta: '45% done · paused 12d' }
];

export default function CardSpread({ projects = DEFAULT_PROJECTS, onSelect }) {
  return (
    <div className="cs-deck" role="list" aria-label="Shelved projects">
      {projects.slice(0, 5).map((p) => (
        <div
          key={p.name}
          className="cs-card"
          role="listitem"
          tabIndex={0}
          onClick={() => onSelect?.(p)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect?.(p);
            }
          }}
        >
          <span className={`cs-tag cs-tag--${p.tagKey}`}>{p.tag}</span>
          <span className="cs-name">{p.name}</span>
          <span className="cs-meta">{p.meta}</span>
        </div>
      ))}
    </div>
  );
}
