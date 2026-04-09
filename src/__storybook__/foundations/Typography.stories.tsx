import type { Meta, StoryObj } from '@storybook/react-vite';

interface TypeStyle {
  role: string;
  size: string;
  weight: string | number;
  lineHeight: string | number;
  usage: string;
  sampleText: string;
  style?: React.CSSProperties;
}

const TYPE_SCALE: TypeStyle[] = [
  {
    role: 'Page Title',
    size: '1.75rem / 28px',
    weight: 600,
    lineHeight: 1.2,
    usage: 'Dashboard heading, main page title',
    sampleText: 'My Trip Plans',
    style: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.2 },
  },
  {
    role: 'Section Heading',
    size: '1.25rem / 20px',
    weight: 600,
    lineHeight: 1.3,
    usage: 'Card titles, modal headings, day headers',
    sampleText: 'Kraków Weekend',
    style: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
  },
  {
    role: 'Subsection',
    size: '1rem / 16px',
    weight: 600,
    lineHeight: 1.4,
    usage: 'Form group legends, panel headings',
    sampleText: 'Basic Information',
    style: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  },
  {
    role: 'Body (strong)',
    size: '0.875rem / 14px',
    weight: 600,
    lineHeight: 1.4,
    usage: 'Card titles, labels, overflow menu items',
    sampleText: 'Wawel Royal Castle',
    style: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
  },
  {
    role: 'Body',
    size: '0.875rem / 14px',
    weight: 400,
    lineHeight: 1.55,
    usage: 'Default text, descriptions, search results',
    sampleText: 'A fortified architectural complex on the Vistula River in Kraków, Poland. The site includes a Gothic cathedral and royal palace.',
    style: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.55 },
  },
  {
    role: 'Caption',
    size: '0.75rem / 12px',
    weight: 400,
    lineHeight: 1.35,
    usage: 'Metadata, timestamps, category labels, helper text',
    sampleText: 'attraction · ⏰ 9:00–17:00 · ⭐ 4.8/5',
    style: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.35 },
  },
  {
    role: 'Small',
    size: '0.6875rem / 11px',
    weight: 500,
    lineHeight: 1.3,
    usage: 'Badges, keyboard hints, footer text',
    sampleText: 'DAY 1 · ↑↓ Navigate · Enter Select · Esc Close',
    style: { fontSize: '0.6875rem', fontWeight: 500, lineHeight: 1.3 },
  },
  {
    role: 'Tiny',
    size: '10px',
    weight: 400,
    lineHeight: 1.3,
    usage: 'Image attribution text',
    sampleText: '© Jan Mehlich · CC BY-SA 3.0 · Wikimedia Commons',
    style: { fontSize: '10px', fontWeight: 400, lineHeight: 1.3 },
  },
];

const WEIGHTS: Array<{ name: string; value: number; usage: string }> = [
  { name: 'Regular', value: 400, usage: 'Body text, descriptions' },
  { name: 'Medium', value: 500, usage: 'Meta labels, tags, hints' },
  { name: 'Semibold', value: 600, usage: 'Headings, card titles, labels' },
  { name: 'Bold', value: 700, usage: 'Map marker numbers' },
];

function TypeScaleRow({ style, role, size, weight, lineHeight, usage, sampleText }: TypeStyle) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: '1.5rem',
        padding: '1rem 0',
        borderBottom: '1px solid var(--cds-border-subtle)',
        alignItems: 'start',
      }}
    >
      {/* Metadata column */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-primary)', marginBottom: 4 }}>{role}</div>
        <div style={{ fontSize: 11, color: 'var(--cds-text-secondary)', lineHeight: 1.5, fontFamily: 'IBM Plex Mono, monospace' }}>
          {size}<br />
          w{weight} / lh {lineHeight}
        </div>
        <div style={{ fontSize: 11, color: 'var(--cds-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
          {usage}
        </div>
      </div>

      {/* Sample text column */}
      <div
        style={{
          fontFamily: 'IBM Plex Sans, Helvetica Neue, Arial, sans-serif',
          color: 'var(--cds-text-primary)',
          wordBreak: 'break-word',
          ...style,
        }}
      >
        {sampleText}
      </div>
    </div>
  );
}

function TypographyShowcase() {
  return (
    <div style={{ maxWidth: 760, fontFamily: 'IBM Plex Sans, Helvetica Neue, Arial, sans-serif' }}>
      <p style={{ fontSize: 14, color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
        Typeface: <strong>IBM Plex Sans</strong> · Code: <strong>IBM Plex Mono</strong>
      </p>
      <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: '2rem' }}>
        Loaded via Google Fonts in <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>.storybook/preview-head.html</code>.
        The same font is included automatically by <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>@carbon/styles</code> in the app.
      </p>

      {/* Type scale */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary)', margin: '0 0 0' }}>
        Type Scale
      </h2>
      {TYPE_SCALE.map((row) => (
        <TypeScaleRow key={row.role} {...row} />
      ))}

      {/* Weight showcase */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary)', margin: '2rem 0 0.5rem' }}>
        Weights
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
        {WEIGHTS.map(({ name, value, usage }) => (
          <div key={value} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-primary)' }}>{name} ({value})</div>
              <div style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>{usage}</div>
            </div>
            <div
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '1.25rem',
                fontWeight: value,
                color: 'var(--cds-text-primary)',
              }}
            >
              Trip Planner
            </div>
          </div>
        ))}
      </div>

      {/* Monospace */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary)', margin: '2rem 0 0.75rem' }}>
        Monospace (IBM Plex Mono)
      </h2>
      <div
        style={{
          background: 'var(--cds-layer-01)',
          border: '1px solid var(--cds-border-subtle)',
          borderRadius: 4,
          padding: '0.875rem 1rem',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '0.8125rem',
          color: 'var(--cds-text-primary)',
          lineHeight: 1.6,
        }}
      >
        <div>$text-primary    → var(--cds-text-primary)</div>
        <div>$layer-02        → var(--cds-layer-02)</div>
        <div>$border-subtle   → var(--cds-border-subtle)</div>
        <div style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>// Used in: token labels, code snippets</div>
      </div>

      {/* Rules */}
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary)', margin: '2rem 0 0.75rem' }}>
        Rules
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#24a148', marginBottom: '0.5rem' }}>✓ Do</div>
          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 12, color: 'var(--cds-text-secondary)', lineHeight: 1.7 }}>
            <li>Weight 600 for all headings</li>
            <li>Weight 400 for body text</li>
            <li>Line-height ≥ 1.5 for readable paragraphs</li>
            <li>Max ~65–80 chars per line</li>
          </ul>
        </div>
        <div style={{ background: 'var(--cds-layer-01)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#da1e28', marginBottom: '0.5rem' }}>✗ Don't</div>
          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 12, color: 'var(--cds-text-secondary)', lineHeight: 1.7 }}>
            <li>Use weight 700 for UI text</li>
            <li>Use <code>px</code> sizes — stick to <code>rem</code></li>
            <li>Use arbitrary sizes (13px, 17px)</li>
            <li>Override font-family outside map markers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof TypographyShowcase> = {
  title: 'Foundations/Typography',
  component: TypographyShowcase,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'IBM Plex Sans type scale used across Trip Planner.',
      },
    },
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof TypographyShowcase>;

export const TypeScale: Story = {
  name: 'Type Scale',
};
