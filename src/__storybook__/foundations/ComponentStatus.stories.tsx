import type { Meta, StoryObj } from '@storybook/react-vite';

// ─── Types & Data ──────────────────────────────────────────────────────────────

type Status = 'stable' | 'wip' | 'planned' | 'blocked';

interface ComponentRow {
  name: string;
  path?: string;
  story: boolean;
  docs: boolean;
  a11y: boolean;
  playTests: number;
  status: Status;
}

interface BacklogItem {
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const FOUNDATIONS: Array<{ name: string; status: Status }> = [
  { name: 'Colors',      status: 'stable' },
  { name: 'Typography',  status: 'stable' },
  { name: 'Spacing',     status: 'stable' },
  { name: 'Icons',       status: 'stable' },
  { name: 'Motion',      status: 'stable' },
];

const PRIMITIVES: ComponentRow[] = [
  { name: 'Button',             story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'TextInput',          story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'Select',             story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'Modal',              story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'Tile / ClickableTile', story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'Loading',            story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'InlineNotification', story: true, docs: true, a11y: true, playTests: 1, status: 'stable' },
  { name: 'Tabs',               story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'OverflowMenu',       story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'DatePicker',         story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'Stack',              story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'FormGroup',          story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
];

const APP_COMPONENTS: ComponentRow[] = [
  { name: 'LocationCard',       path: 'components/layout/',       story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'TransportCard',      path: 'components/transport/',    story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'ImageWithPlaceholder', path: 'components/ui/',         story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'CoverWithPlaceholder', path: 'components/ui/',         story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'LocationFormModal',  path: 'components/map/',          story: true, docs: true, a11y: true, playTests: 3, status: 'stable' },
  { name: 'TripPlanFormModal',  path: 'components/plan/',         story: true, docs: true, a11y: true, playTests: 2, status: 'stable' },
  { name: 'TransportFormModal', path: 'components/transport/',    story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'ContextMenu',        path: 'components/map/',          story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'LocationPopup',      path: 'components/map/',          story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'SearchResults',      path: 'components/search/',       story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
  { name: 'ChatPlaceTiles',     path: 'components/chat/',         story: true, docs: true, a11y: true, playTests: 0, status: 'stable' },
];

const PATTERNS: Array<{ name: string; status: Status }> = [
  { name: 'Form Pattern',        status: 'stable' },
  { name: 'Card Pattern',        status: 'stable' },
  { name: 'Modal Pattern',       status: 'stable' },
  { name: 'Feedback Pattern',    status: 'stable' },
  { name: 'Empty State Pattern', status: 'stable' },
];

const BACKLOG: BacklogItem[] = [
  { name: 'AppLayout',      reason: 'Requires router (Header + Sidebar + ChatPanel)',   priority: 'low' },
  { name: 'Header',         reason: 'Complex search + geocoding integration',           priority: 'medium' },
  { name: 'Sidebar',        reason: 'dnd-kit + Firebase data dependency',              priority: 'medium' },
  { name: 'ChatPanel',      reason: 'Tambo AI provider dependency',                    priority: 'low' },
  { name: 'DashboardWizard',reason: 'Firebase + multi-step wizard state',              priority: 'low' },
  { name: 'MapView',        reason: 'Leaflet needs real browser DOM',                  priority: 'low' },
  { name: 'LocationMarker', reason: 'Leaflet dependency',                              priority: 'low' },
  { name: 'MapClickHandler',reason: 'Leaflet event only, no UI surface',              priority: 'low' },
  { name: 'RoutePolyline',  reason: 'Leaflet + routing engine',                        priority: 'low' },
  { name: 'ChatMiniMap',    reason: 'Leaflet + unused placeholder',                    priority: 'low' },
];

// ─── Visual helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string; border: string }> = {
  stable:  { label: 'Stable',  bg: '#defbe6', color: '#0e6027', border: '#74e792' },
  wip:     { label: 'WIP',     bg: '#fff8e1', color: '#8e5b00', border: '#f1c21b' },
  planned: { label: 'Planned', bg: '#edf5ff', color: '#003a6d', border: '#78a9ff' },
  blocked: { label: 'Blocked', bg: '#fff1f1', color: '#a2191f', border: '#ff8389' },
};

const PRIORITY_CONFIG: Record<BacklogItem['priority'], { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: '#a2191f', bg: '#fff1f1' },
  medium: { label: 'Medium', color: '#8e5b00', bg: '#fff8e1' },
  low:    { label: 'Low',    color: '#525252', bg: '#f4f4f4' },
};

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        borderRadius: 3,
        padding: '2px 7px',
        letterSpacing: '0.03em',
      }}
    >
      {c.label}
    </span>
  );
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span style={{ fontSize: 13, color: ok ? '#24a148' : '#c6c6c6' }}>
      {ok ? '✓' : '–'}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--cds-text-secondary, #525252)',
      margin: '2rem 0 0.625rem',
    }}>
      {children}
    </h2>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        background: 'var(--cds-layer-01, #f4f4f4)',
        border: `1px solid ${color}40`,
        borderTop: `3px solid ${color}`,
        borderRadius: 6,
        padding: '0.875rem 1rem',
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{count}</div>
      <div style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: `${color}20`, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary, #525252)', width: 42, textAlign: 'right' }}>
        {done}/{total}
      </span>
    </div>
  );
}

// ─── Component table ───────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--cds-text-secondary, #525252)',
  padding: '0 0.5rem 0.375rem',
  textAlign: 'left',
  borderBottom: '2px solid var(--cds-border-subtle, #e0e0e0)',
};

const TD: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--cds-text-primary, #161616)',
  padding: '0.5rem 0.5rem',
  borderBottom: '1px solid var(--cds-border-subtle, #e0e0e0)',
  verticalAlign: 'middle',
};

function ComponentTable({ rows, showPath }: { rows: ComponentRow[]; showPath?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ ...TH, minWidth: 160 }}>Component</th>
            {showPath && <th style={{ ...TH, minWidth: 140 }}>Path</th>}
            <th style={{ ...TH, width: 48, textAlign: 'center' }}>Story</th>
            <th style={{ ...TH, width: 48, textAlign: 'center' }}>Docs</th>
            <th style={{ ...TH, width: 48, textAlign: 'center' }}>a11y</th>
            <th style={{ ...TH, width: 60, textAlign: 'center' }}>Play</th>
            <th style={{ ...TH, width: 80 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} style={{ transition: 'background 150ms' }}>
              <td style={{ ...TD, fontWeight: 600 }}>{r.name}</td>
              {showPath && (
                <td style={TD}>
                  <code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary, #525252)' }}>
                    {r.path}
                  </code>
                </td>
              )}
              <td style={{ ...TD, textAlign: 'center' }}><Check ok={r.story} /></td>
              <td style={{ ...TD, textAlign: 'center' }}><Check ok={r.docs} /></td>
              <td style={{ ...TD, textAlign: 'center' }}><Check ok={r.a11y} /></td>
              <td style={{ ...TD, textAlign: 'center' }}>
                {r.playTests > 0
                  ? <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: '#0f62fe', fontWeight: 600 }}>{r.playTests}</span>
                  : <span style={{ color: '#c6c6c6', fontSize: 11 }}>–</span>
                }
              </td>
              <td style={TD}><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function ComponentStatusPage() {
  const totalDocs = FOUNDATIONS.length + PRIMITIVES.length + APP_COMPONENTS.length + PATTERNS.length;
  const totalPlay = [...PRIMITIVES, ...APP_COMPONENTS].reduce((s, r) => s + r.playTests, 0);

  return (
    <div style={{ maxWidth: 860, fontFamily: 'IBM Plex Sans, Helvetica Neue, Arial, sans-serif' }}>
      <p style={{ fontSize: 14, color: 'var(--cds-text-secondary, #525252)', margin: '0 0 1.5rem' }}>
        Inventory of all documented UI components. Use this as your first stop to check what's available and what's still in the backlog.
      </p>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard count={totalDocs}              label="Documented total" color="#0f62fe" />
        <StatCard count={FOUNDATIONS.length}     label="Foundations"      color="#007d79" />
        <StatCard count={PRIMITIVES.length}      label="Primitives"       color="#0072c3" />
        <StatCard count={APP_COMPONENTS.length}  label="App Components"   color="#8a3ffc" />
        <StatCard count={PATTERNS.length}        label="Patterns"         color="#24a148" />
        <StatCard count={totalPlay}              label="Play tests"       color="#ff832b" />
      </div>

      {/* ── Progress overview ── */}
      <SectionLabel>Documentation Progress</SectionLabel>
      <div
        style={{
          background: 'var(--cds-layer-01, #f4f4f4)',
          border: '1px solid var(--cds-border-subtle, #e0e0e0)',
          borderRadius: 6,
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          marginBottom: '2rem',
        }}
      >
        {[
          { label: 'Foundations',     done: FOUNDATIONS.length,    total: FOUNDATIONS.length,    color: '#007d79' },
          { label: 'Primitives',      done: PRIMITIVES.length,     total: PRIMITIVES.length,     color: '#0072c3' },
          { label: 'App Components',  done: APP_COMPONENTS.length, total: APP_COMPONENTS.length + BACKLOG.length, color: '#8a3ffc' },
          { label: 'Patterns',        done: PATTERNS.length,       total: PATTERNS.length,       color: '#24a148' },
        ].map(({ label, done, total, color }) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--cds-text-primary, #161616)', fontWeight: 500 }}>{label}</span>
            <ProgressBar done={done} total={total} color={color} />
          </div>
        ))}
      </div>

      {/* ── Foundations ── */}
      <SectionLabel>Foundations</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {FOUNDATIONS.map(({ name, status }) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--cds-layer-01, #f4f4f4)',
              border: '1px solid var(--cds-border-subtle, #e0e0e0)',
              borderRadius: 4,
              padding: '0.5rem 0.875rem',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>{name}</span>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      {/* ── Primitives ── */}
      <SectionLabel>Primitives (Carbon)</SectionLabel>
      <ComponentTable rows={PRIMITIVES} />

      {/* ── App Components ── */}
      <SectionLabel>App Components</SectionLabel>
      <ComponentTable rows={APP_COMPONENTS} showPath />

      {/* ── Patterns ── */}
      <SectionLabel>Patterns</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {PATTERNS.map(({ name, status }) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--cds-layer-01, #f4f4f4)',
              border: '1px solid var(--cds-border-subtle, #e0e0e0)',
              borderRadius: 4,
              padding: '0.5rem 0.875rem',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>{name}</span>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      {/* ── Backlog ── */}
      <SectionLabel>Documentation Backlog</SectionLabel>
      <p style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.75rem' }}>
        Components with heavy dependencies (Leaflet, Firebase, dnd-kit) that require mocks or custom decorators.
      </p>
      <div
        style={{
          background: 'var(--cds-layer-01, #f4f4f4)',
          border: '1px solid var(--cds-border-subtle, #e0e0e0)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {BACKLOG.map(({ name, reason, priority }, i) => {
          const pc = PRIORITY_CONFIG[priority];
          return (
            <div
              key={name}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 72px',
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.625rem 1rem',
                borderBottom: i < BACKLOG.length - 1 ? '1px solid var(--cds-border-subtle, #e0e0e0)' : 'none',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-primary, #161616)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)' }}>{reason}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: pc.color,
                  background: pc.bg,
                  border: `1px solid ${pc.color}30`,
                  borderRadius: 3,
                  padding: '2px 7px',
                  textAlign: 'center',
                }}
              >
                {pc.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p style={{ fontSize: 11, color: 'var(--cds-text-secondary, #525252)', marginTop: '2rem', fontFamily: 'IBM Plex Mono, monospace' }}>
        Last updated: April 2026
      </p>
    </div>
  );
}

// ─── Story ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ComponentStatusPage> = {
  title: 'Design System/Component Status',
  component: ComponentStatusPage,
  parameters: {
    docs: { canvas: { sourceState: 'hidden' } },
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentStatusPage>;

export const Docs: Story = { name: 'Component Status' };
