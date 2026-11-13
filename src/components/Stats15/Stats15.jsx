/**
 * Stats15 — coverage dial + ledger.
 * Ported from the provided TypeScript/Tailwind source: types stripped,
 * neutral/emerald colors swapped for Shelved theme tokens, shadows removed,
 * and the copy adapted to what we actually measure (context coverage and
 * the reasons projects get shelved).
 */
const ledgerItems = [
  {
    title: 'Too complex',
    description: 'Scope outgrew the weekend prototype',
    percentage: 24
  },
  {
    title: 'Moved on',
    description: 'A newer idea earned the evenings instead',
    percentage: 21
  },
  {
    title: 'No time',
    description: 'Exams, placements and deadlines took the hours',
    percentage: 20
  },
  {
    title: 'Lost interest',
    description: 'The spark faded once the hard part arrived',
    percentage: 16
  }
];

export default function Stats15({ currentCoverage = 82, previousCoverage = 54, scope = 'Across the projects in your archive' }) {
  // SVG Semicircle Gauge Math
  const radius = 84;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (currentCoverage / 100) * circumference;

  const box = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '1rem'
  };
  const inner = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem'
  };

  return (
    <section className="mx-auto max-w-5xl p-6 sm:p-10" style={box}>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        {/* Left Column: Coverage Dial */}
        <div
          className="flex flex-col items-center justify-center p-8 lg:col-span-5"
          style={inner}
        >
          <div className="relative flex items-center justify-center">
            <svg className="h-36 w-60 overflow-visible" viewBox="0 0 200 110">
              {/* Background Track */}
              <path
                d="M 16 100 A 84 84 0 0 1 184 100"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d="M 16 100 A 84 84 0 0 1 184 100"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'all 700ms ease-out' }}
              />
            </svg>

            {/* Center Metric Readout */}
            <div className="absolute bottom-2 flex flex-col items-center text-center">
              <span className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                {currentCoverage}%
              </span>
              <span className="mt-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                Context coverage
              </span>
            </div>
          </div>

          {/* Period Comparison Badges */}
          <div className="mt-6 flex items-center gap-3 text-xs font-medium">
            <span
              className="rounded-full px-2.5 py-1"
              style={{
                background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                color: 'var(--accent)'
              }}
            >
              This term · {currentCoverage}%
            </span>
            <span
              className="rounded-full px-2.5 py-1"
              style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}
            >
              Last term · {previousCoverage}%
            </span>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
            {scope}
          </p>
        </div>

        {/* Right Column: Ledger */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              What keeps projects shelved
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              Breakdown of captured projects by the reason they stopped.
            </p>
          </div>

          <div className="border-y" style={{ borderColor: 'var(--border)' }}>
            {ledgerItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-4 py-4"
                style={{
                  borderTop: item === ledgerItems[0] ? 'none' : '1px solid var(--border)',
                  transition: 'background-color 150ms ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {item.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="hidden h-1.5 w-20 overflow-hidden rounded-full sm:block"
                    style={{ background: 'var(--border)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(item.percentage / 30) * 100}%`, background: 'var(--accent)' }}
                    />
                  </div>
                  <span
                    className="w-10 text-right font-mono text-sm font-semibold"
                    style={{ color: 'var(--text)' }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
