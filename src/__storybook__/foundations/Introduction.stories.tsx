import type { Meta, StoryObj } from '@storybook/react-vite';

// ─── Data ──────────────────────────────────────────────────────────────────────

const STACK = [
  { label: 'Design System', value: 'IBM Carbon v11', icon: '🎨', mono: '@carbon/react ^1.97' },
  { label: 'Icons',         value: 'Carbon Icons',   icon: '✦',  mono: '@carbon/icons-react ^11.71' },
  { label: 'Framework',     value: 'React 18',       icon: '⚛',  mono: 'TypeScript (strict)' },
  { label: 'Bundler',       value: 'Vite 6',         icon: '⚡',  mono: '@vitejs/plugin-react ^4' },
  { label: 'Styling',       value: 'SCSS Modules',   icon: '🖌',  mono: '+ Carbon tokens' },
  { label: 'Backend',       value: 'Firebase',       icon: '🔥',  mono: 'Firestore + Auth' },
  { label: 'Map',           value: 'Leaflet',        icon: '🗺',  mono: 'react-leaflet ^4' },
  { label: 'AI Chat',       value: 'Tambo AI',       icon: '🤖',  mono: '@tambo-ai/react' },
];

const LAYERS = [
  {
    name: 'Patterns',
    color: '#8a3ffc',
    bg: '#8a3ffc12',
    description: 'Reusable composition patterns & guidelines',
    items: ['Form Pattern', 'Card Pattern', 'Modal Pattern', 'Feedback', 'Empty State'],
  },
  {
    name: 'Components',
    color: '#0072c3',
    bg: '#0072c312',
    description: 'App-specific components built on Carbon',
    items: ['LocationCard', 'TransportCard', 'LocationFormModal', 'SearchResults', '…'],
  },
  {
    name: 'Primitives',
    color: '#0f62fe',
    bg: '#0f62fe12',
    description: 'Carbon components as configured for this app',
    items: ['Button', 'TextInput', 'Modal', 'Tabs', 'Notification', '…'],
  },
  {
    name: 'Foundations',
    color: '#007d79',
    bg: '#007d7912',
    description: 'Design tokens: colors, typography, spacing, icons, motion',
    items: ['Colors', 'Typography', 'Spacing', 'Icons', 'Motion'],
  },
];

const PRINCIPLES = [
  {
    num: '01',
    title: 'Carbon first',
    body: 'Always reach for a Carbon component before building custom UI. New components justify themselves with a written reason.',
    color: '#0f62fe',
  },
  {
    num: '02',
    title: 'Token-driven',
    body: 'Use $token in SCSS modules, var(--cds-*) in global / inline styles. No hardcoded hex, no arbitrary pixel values.',
    color: '#007d79',
  },
  {
    num: '03',
    title: 'Accessible by default',
    body: 'WCAG AA compliance, keyboard navigation, screen-reader labels. a11y addon runs in every story.',
    color: '#24a148',
  },
  {
    num: '04',
    title: 'State-complete',
    body: 'Every component covers: loading, error, empty, disabled, hover, and focus. No skeleton states left to imagination.',
    color: '#8a3ffc',
  },
  {
    num: '05',
    title: 'Consistent feedback',
    body: 'Every user action produces visible feedback — notification, loading spinner, or transition. Never silence after a click.',
    color: '#ff832b',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StackCard({ label, value, icon, mono }: typeof STACK[0]) {
  return (
    <div
      style={{
        background: 'var(--cds-layer-01, #f4f4f4)',
        border: '1px solid var(--cds-border-subtle, #e0e0e0)',
        borderRadius: 6,
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cds-text-secondary, #525252)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>{value}</div>
      <code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary, #525252)' }}>{mono}</code>
    </div>
  );
}

function ArchitectureLayer({ name, color, bg, description, items }: typeof LAYERS[0]) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 4,
        padding: '0.75rem 1rem',
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: '0.75rem',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--cds-text-secondary, #525252)', marginTop: 2, lineHeight: 1.4 }}>{description}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              fontSize: 11,
              background: `${color}18`,
              color,
              border: `1px solid ${color}40`,
              borderRadius: 3,
              padding: '2px 7px',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function PrincipleCard({ num, title, body, color }: typeof PRINCIPLES[0]) {
  return (
    <div
      style={{
        background: 'var(--cds-layer-01, #f4f4f4)',
        border: '1px solid var(--cds-border-subtle, #e0e0e0)',
        borderRadius: 6,
        padding: '1rem',
        display: 'flex',
        gap: '0.875rem',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'IBM Plex Mono, monospace',
          color,
          background: `${color}15`,
          border: `1px solid ${color}40`,
          borderRadius: 4,
          padding: '3px 7px',
          height: 'fit-content',
          flexShrink: 0,
          letterSpacing: '0.04em',
        }}
      >
        {num}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cds-text-primary, #161616)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function IntroductionPage() {
  return (
    <div style={{ maxWidth: 820, fontFamily: 'IBM Plex Sans, Helvetica Neue, Arial, sans-serif' }}>

      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f62fe08 0%, #007d7912 50%, #8a3ffc08 100%)',
          border: '1px solid var(--cds-border-subtle, #e0e0e0)',
          borderRadius: 8,
          padding: '2rem 2rem 1.75rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: 28 }}>✈️</span>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-text-primary, #161616)' }}>
            Trip Planner
          </h1>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: '#0f62fe',
              color: '#fff',
              borderRadius: 3,
              padding: '2px 8px',
              marginLeft: 4,
              letterSpacing: '0.04em',
            }}
          >
            DESIGN SYSTEM
          </span>
        </div>
        <p style={{ margin: '0 0 1.25rem', fontSize: 15, color: 'var(--cds-text-secondary, #525252)', lineHeight: 1.6, maxWidth: 560 }}>
          Single source of truth for all UI components, design tokens, and patterns used in the Trip Planner application.
          Built on <strong>IBM Carbon Design System v11</strong>.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Foundations', count: 5, color: '#007d79' },
            { label: 'Primitives',  count: 12, color: '#0f62fe' },
            { label: 'Components',  count: 11, color: '#0072c3' },
            { label: 'Patterns',    count: 5,  color: '#8a3ffc' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.75rem' }}>
        Tech Stack
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.625rem',
          marginBottom: '2rem',
        }}
      >
        {STACK.map((s) => <StackCard key={s.label} {...s} />)}
      </div>

      {/* Architecture */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.5rem' }}>
        Architecture
      </h2>
      <p style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.75rem' }}>
        Components are layered — higher layers consume lower ones. Never skip a layer.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        {LAYERS.map((l) => <ArchitectureLayer key={l.name} {...l} />)}
        {/* Base label */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--cds-text-secondary, #525252)', marginTop: 2 }}>
          ▲ builds on ▲
        </div>
      </div>

      {/* Principles */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.75rem' }}>
        Principles
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {PRINCIPLES.map((p) => <PrincipleCard key={p.num} {...p} />)}
      </div>
    </div>
  );
}

// ─── Story ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof IntroductionPage> = {
  title: 'Design System/Introduction',
  component: IntroductionPage,
  parameters: {
    docs: { canvas: { sourceState: 'hidden' } },
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof IntroductionPage>;

export const Docs: Story = { name: 'Introduction' };
