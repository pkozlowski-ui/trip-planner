import type { Meta, StoryObj } from '@storybook/react-vite';

// ─── Data ────────────────────────────────────────────────────────────────────

interface SpacingToken {
  token: string;
  rem: string;
  px: number;
  usage: string;
}

const SCALE: SpacingToken[] = [
  { token: '$spacing-01', rem: '0.125rem', px: 2,  usage: 'Hairline gaps, separator insets' },
  { token: '$spacing-02', rem: '0.25rem',  px: 4,  usage: 'Icon gap, minimal padding' },
  { token: '$spacing-03', rem: '0.5rem',   px: 8,  usage: 'Tag padding, tight layout' },
  { token: '$spacing-04', rem: '0.75rem',  px: 12, usage: 'Card body padding, inline gaps' },
  { token: '$spacing-05', rem: '1rem',     px: 16, usage: 'Standard form gaps, panel padding' },
  { token: '$spacing-06', rem: '1.5rem',   px: 24, usage: 'Section spacing, modal content' },
  { token: '$spacing-07', rem: '2rem',     px: 32, usage: 'Large gaps between sections' },
  { token: '$spacing-08', rem: '2.5rem',   px: 40, usage: 'Input height (Carbon standard)' },
  { token: '$spacing-09', rem: '3rem',     px: 48, usage: 'XL padding, empty states' },
];

const STACK_GAPS = [
  { gap: 2, px: 4,  label: 'gap={2}' },
  { gap: 3, px: 8,  label: 'gap={3}' },
  { gap: 4, px: 12, label: 'gap={4}' },
  { gap: 5, px: 16, label: 'gap={5}' },
  { gap: 6, px: 24, label: 'gap={6}' },
  { gap: 7, px: 32, label: 'gap={7}' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_SCALE  = 5;  // multiplier so bars are visually comfortable

const s = {
  root: {
    fontFamily: 'IBM Plex Sans, Helvetica Neue, Arial, sans-serif',
    maxWidth: 760,
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--cds-text-secondary)',
    margin: '2rem 0 0.75rem',
  } as React.CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr 200px',
    gap: '1rem',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--cds-border-subtle)',
  } as React.CSSProperties,
  tokenLabel: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 12,
    color: 'var(--cds-text-primary)',
    fontWeight: 600,
  } as React.CSSProperties,
  meta: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11,
    color: 'var(--cds-text-secondary)',
    marginTop: 2,
  } as React.CSSProperties,
  usage: {
    fontSize: 12,
    color: 'var(--cds-text-secondary)',
    lineHeight: 1.4,
  } as React.CSSProperties,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 style={s.sectionLabel}>{children}</h2>;
}

/** Main ruler rows */
function ScaleRow({ token, rem, px, usage }: SpacingToken) {
  const barWidth = Math.max(px * BAR_SCALE, 4);
  return (
    <div style={s.row}>
      {/* Token + values */}
      <div>
        <div style={s.tokenLabel}>{token}</div>
        <div style={s.meta}>{rem} · {px}px</div>
      </div>

      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            height: 20,
            width: barWidth,
            background: 'var(--cds-interactive)',
            borderRadius: 2,
            flexShrink: 0,
            opacity: 0.85,
          }}
        />
        <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)' }}>
          {px}px
        </span>
      </div>

      {/* Usage */}
      <div style={s.usage}>{usage}</div>
    </div>
  );
}

/** Card padding demo */
function CardPaddingDemo({ px }: { px: number }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Padding highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 98, 254, 0.08)',
          border: '2px dashed rgba(15, 98, 254, 0.4)',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          padding: px,
          background: 'var(--cds-layer-02)',
          border: '1px solid var(--cds-border-subtle)',
          borderRadius: 4,
          minWidth: 160,
        }}
      >
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 3, padding: '6px 8px', fontSize: 12, color: 'var(--cds-text-primary)' }}>
          Card content
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--cds-text-secondary)', fontFamily: 'IBM Plex Mono, monospace' }}>
        padding: {px}px
      </div>
    </div>
  );
}

/** Form stack demo */
function StackDemo({ gap, px }: { gap: number; px: number }) {
  const fields = ['Location name', 'Category'];
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
        {fields.map((label, i) => (
          <div key={label}>
            <div
              style={{
                background: 'var(--cds-layer-02)',
                border: '1px solid var(--cds-border-subtle)',
                borderRadius: 3,
                padding: '6px 10px',
                fontSize: 12,
                color: 'var(--cds-text-secondary)',
                minWidth: 160,
              }}
            >
              {label}
            </div>
            {i < fields.length - 1 && (
              <div style={{ position: 'relative', height: px, display: 'flex', alignItems: 'center' }}>
                {/* Gap measurement line */}
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(15,98,254,0.4)', borderLeft: '1px dashed rgba(15,98,254,0.6)' }} />
                <div style={{ position: 'absolute', left: '52%', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'rgba(15,98,254,0.9)', whiteSpace: 'nowrap' }}>
                  {px}px
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--cds-text-secondary)', fontFamily: 'IBM Plex Mono, monospace' }}>
        Stack gap={`{${gap}}`}
      </div>
    </div>
  );
}

/** Section margin demo */
function SectionMarginDemo({ px }: { px: number }) {
  return (
    <div>
      <div
        style={{
          background: 'var(--cds-layer-01)',
          border: '1px solid var(--cds-border-subtle)',
          borderRadius: 3,
          padding: '6px 12px',
          fontSize: 12,
          color: 'var(--cds-text-primary)',
          minWidth: 160,
        }}
      >
        Section A
      </div>
      <div style={{ position: 'relative', height: px, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 1, background: 'rgba(15,98,254,0.25)' }} />
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(15,98,254,0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 0,
            bottom: 0,
            right: 4,
            border: '1px dashed rgba(15,98,254,0.4)',
            borderRadius: 2,
          }}
        />
        <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'rgba(15,98,254,0.9)', marginLeft: 8, zIndex: 1 }}>
          {px}px
        </span>
      </div>
      <div
        style={{
          background: 'var(--cds-layer-01)',
          border: '1px solid var(--cds-border-subtle)',
          borderRadius: 3,
          padding: '6px 12px',
          fontSize: 12,
          color: 'var(--cds-text-primary)',
        }}
      >
        Section B
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--cds-text-secondary)', fontFamily: 'IBM Plex Mono, monospace' }}>
        margin: {px}px
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function SpacingShowcase() {
  return (
    <div style={s.root}>
      <p style={{ fontSize: 14, color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
        All spacing uses the <strong>Carbon 8px base grid</strong>. Every token is a multiple of 4px,
        with most UI elements snapping to multiples of 8px.
      </p>
      <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: '2rem' }}>
        Use <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>$spacing-*</code> in SCSS modules,
        or matching <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>rem</code> values in inline styles.
      </p>

      {/* ── Ruler ── */}
      <SectionLabel>Spacing Scale</SectionLabel>
      <div style={{ marginBottom: '0.25rem', display: 'grid', gridTemplateColumns: '140px 1fr 200px', gap: '1rem' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Token</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Usage</span>
      </div>
      {SCALE.map((t) => <ScaleRow key={t.token} {...t} />)}

      {/* ── Live Usage ── */}
      <SectionLabel>Live Usage Examples</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '2.5rem', justifyContent: 'start', padding: '1rem 0' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-primary)', marginBottom: '0.75rem' }}>
            Card padding <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 400, color: 'var(--cds-text-secondary)' }}>$spacing-04</span>
          </div>
          <CardPaddingDemo px={12} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-primary)', marginBottom: '0.75rem' }}>
            Form gap <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 400, color: 'var(--cds-text-secondary)' }}>$spacing-05</span>
          </div>
          <StackDemo gap={5} px={16} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-primary)', marginBottom: '0.75rem' }}>
            Section margin <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 400, color: 'var(--cds-text-secondary)' }}>$spacing-06</span>
          </div>
          <SectionMarginDemo px={24} />
        </div>
      </div>

      {/* ── Stack gaps ── */}
      <SectionLabel>Stack Component — Gap Reference</SectionLabel>
      <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
        Carbon's <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>&lt;Stack gap=&#123;N&#125;&gt;</code> maps directly to the spacing scale.
        The number matches the token index.
      </p>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {STACK_GAPS.map(({ gap, px, label }) => (
          <div key={gap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
            <code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)', marginBottom: 6 }}>
              {label} = {px}px
            </code>
            {/* Two mock elements with the gap between them */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: px,
              }}
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 80,
                    height: 24,
                    background: i === 0 ? 'var(--cds-interactive)' : 'var(--cds-layer-02)',
                    border: '1px solid var(--cds-border-subtle)',
                    borderRadius: 3,
                    opacity: i === 0 ? 0.7 : 1,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pitfalls ── */}
      <SectionLabel>Common Pitfalls</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {/* Too tight */}
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ background: '#da1e2820', padding: '0.375rem 0.75rem', fontSize: 11, fontWeight: 700, color: '#da1e28', letterSpacing: '0.04em' }}>
            ✗ Too tight (4px)
          </div>
          <div style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['Location name', 'Category', 'Notes'].map(f => (
                <div key={f} style={{ background: 'var(--cds-layer-02)', border: '1px solid var(--cds-border-subtle)', borderRadius: 3, padding: '5px 8px', fontSize: 12, color: 'var(--cds-text-primary)' }}>{f}</div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)', marginTop: 8 }}>Form feels cramped, hard to scan</p>
          </div>
        </div>

        {/* Just right */}
        <div style={{ background: 'var(--cds-layer-01)', border: '2px solid #24a148', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ background: '#24a14820', padding: '0.375rem 0.75rem', fontSize: 11, fontWeight: 700, color: '#24a148', letterSpacing: '0.04em' }}>
            ✓ Correct (16px = $spacing-05)
          </div>
          <div style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Location name', 'Category', 'Notes'].map(f => (
                <div key={f} style={{ background: 'var(--cds-layer-02)', border: '1px solid var(--cds-border-subtle)', borderRadius: 3, padding: '5px 8px', fontSize: 12, color: 'var(--cds-text-primary)' }}>{f}</div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)', marginTop: 8 }}>Clear groups, easy to read</p>
          </div>
        </div>

        {/* Too loose */}
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ background: '#ff832b20', padding: '0.375rem 0.75rem', fontSize: 11, fontWeight: 700, color: '#ff832b', letterSpacing: '0.04em' }}>
            ✗ Too loose (40px)
          </div>
          <div style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {['Location name', 'Category'].map(f => (
                <div key={f} style={{ background: 'var(--cds-layer-02)', border: '1px solid var(--cds-border-subtle)', borderRadius: 3, padding: '5px 8px', fontSize: 12, color: 'var(--cds-text-primary)' }}>{f}</div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)', marginTop: 8 }}>Fields disconnected, no visual grouping</p>
          </div>
        </div>
      </div>

      {/* ── Rules ── */}
      <SectionLabel>Rules</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#24a148', marginBottom: '0.5rem' }}>✓ Do</div>
          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 12, color: 'var(--cds-text-secondary)', lineHeight: 1.8 }}>
            <li>Use <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>$spacing-*</code> in SCSS modules</li>
            <li>Use matching <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>rem</code> values in inline styles</li>
            <li>Mobile: prefer <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>03–05</code>, desktop: <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>05–07</code></li>
            <li>Round to nearest token (2, 4, 8, 12, 16…)</li>
          </ul>
        </div>
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#da1e28', marginBottom: '0.5rem' }}>✗ Don't</div>
          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 12, color: 'var(--cds-text-secondary)', lineHeight: 1.8 }}>
            <li>Use arbitrary pixels: <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>13px</code>, <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>17px</code>, <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>22px</code></li>
            <li>Mix spacing systems (Tailwind, Material)</li>
            <li>Hard-code <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>padding: 0</code> on Carbon components</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Story ────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SpacingShowcase> = {
  title: 'Foundations/Spacing',
  component: SpacingShowcase,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon 8px-grid spacing scale used across Trip Planner.',
      },
    },
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof SpacingShowcase>;

export const Scale: Story = {
  name: 'Spacing Scale',
};
