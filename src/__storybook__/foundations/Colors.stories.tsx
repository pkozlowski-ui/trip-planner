import type { Meta, StoryObj } from '@storybook/react-vite';

interface ColorToken {
  token: string;
  cssVar: string;
  hex: string;
  usage: string;
}

interface ColorGroup {
  heading: string;
  tokens: ColorToken[];
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    heading: 'Layer — Backgrounds',
    tokens: [
      { token: '$layer-01',       cssVar: '--cds-layer-01',       hex: '#f4f4f4', usage: 'Primary bg: sidebar, panels' },
      { token: '$layer-02',       cssVar: '--cds-layer-02',       hex: '#ffffff', usage: 'Card & input backgrounds' },
      { token: '$layer-hover-01', cssVar: '--cds-layer-hover-01', hex: '#e8e8e8', usage: 'Hover on layer-01' },
      { token: '$layer-hover',    cssVar: '--cds-layer-hover',    hex: '#e8e8e8', usage: 'Hover on cards/tiles' },
      { token: '$layer-selected', cssVar: '--cds-layer-selected', hex: '#e0e0e0', usage: 'Selected / highlighted card' },
      { token: '$layer-accent',   cssVar: '--cds-layer-accent',   hex: '#e0e0e0', usage: 'Tags, badges, accent bg' },
      { token: '$layer-accent-01',cssVar: '--cds-layer-accent-01',hex: '#e0e0e0', usage: 'Wizard message labels' },
    ],
  },
  {
    heading: 'Text',
    tokens: [
      { token: '$text-primary',     cssVar: '--cds-text-primary',     hex: '#161616', usage: 'Headings, body, primary labels' },
      { token: '$text-secondary',   cssVar: '--cds-text-secondary',   hex: '#525252', usage: 'Metadata, captions, helper text' },
      { token: '$text-placeholder', cssVar: '--cds-text-placeholder', hex: '#a8a8a8', usage: 'Input placeholders' },
    ],
  },
  {
    heading: 'Border',
    tokens: [
      { token: '$border-subtle', cssVar: '--cds-border-subtle', hex: '#e0e0e0', usage: 'Card borders, dividers' },
      { token: '$border-strong', cssVar: '--cds-border-strong', hex: '#8d8d8d', usage: 'Input borders, prominent separators' },
    ],
  },
  {
    heading: 'Interactive',
    tokens: [
      { token: '$interactive',        cssVar: '--cds-interactive',         hex: '#0f62fe', usage: 'Primary interactive color' },
      { token: '$focus',              cssVar: '--cds-focus',               hex: '#0f62fe', usage: 'Focus rings, keyboard navigation' },
      { token: '$link-primary',       cssVar: '--cds-link-primary',        hex: '#0f62fe', usage: 'Text links' },
      { token: '$link-primary-hover', cssVar: '--cds-link-primary-hover',  hex: '#0043ce', usage: 'Link hover' },
      { token: '$button-primary',     cssVar: '--cds-button-primary',      hex: '#0f62fe', usage: 'Primary button background' },
    ],
  },
  {
    heading: 'Feedback',
    tokens: [
      { token: '$support-error',   cssVar: '--cds-support-error',   hex: '#da1e28', usage: 'Error states, danger' },
      { token: '$support-success', cssVar: '--cds-support-success', hex: '#24a148', usage: 'Success states' },
      { token: '$support-warning', cssVar: '--cds-support-warning', hex: '#f1c21b', usage: 'Warning states' },
      { token: '$support-info',    cssVar: '--cds-support-info',    hex: '#0043ce', usage: 'Info states' },
    ],
  },
];

const DAY_COLORS = [
  { day: 1, label: 'Day 1', hex: '#0f62fe' },
  { day: 2, label: 'Day 2', hex: '#24a148' },
  { day: 3, label: 'Day 3', hex: '#ff832b' },
  { day: 4, label: 'Day 4', hex: '#8a3ffc' },
  { day: 5, label: 'Day 5', hex: '#da1e28' },
  { day: 6, label: 'Day 6', hex: '#0072c3' },
  { day: 7, label: 'Day 7', hex: '#007d79' },
  { day: 8, label: 'Day 8', hex: '#6f6f6f' },
  { day: 9, label: 'Day 9', hex: '#ffab00' },
  { day: 10, label: 'Day 10', hex: '#161616' },
];

function ColorSwatch({ token, cssVar, hex, usage }: ColorToken) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid var(--cds-border-subtle, #e0e0e0)' }}>
      {/* Swatch — plain color block, no text inside */}
      <div
        style={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: 4,
          background: `var(${cssVar}, ${hex})`,
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      />
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <code style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-primary, #161616)', fontWeight: 600 }}>
            {token}
          </code>
          <code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary, #525252)' }}>
            {cssVar}
          </code>
          <code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary, #525252)' }}>
            {hex}
          </code>
        </div>
        <div style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', marginTop: 2 }}>
          {usage}
        </div>
      </div>
    </div>
  );
}

function ColorPalette() {
  return (
    <div style={{ maxWidth: 680, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <p style={{ fontSize: 14, color: 'var(--cds-text-secondary, #525252)', marginBottom: '1.5rem' }}>
        All colors use <strong>IBM Carbon Design System</strong> tokens. Never use hardcoded hex values — always reference a Sass variable (<code>$token</code>) or CSS custom property (<code>var(--cds-token)</code>).
      </p>

      {COLOR_GROUPS.map((group) => (
        <section key={group.heading} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.25rem' }}>
            {group.heading}
          </h2>
          {group.tokens.map((t) => (
            <ColorSwatch key={t.cssVar} {...t} />
          ))}
        </section>
      ))}

      {/* Day Colors */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.75rem' }}>
          Day Colors (app-specific)
        </h2>
        <p style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', marginBottom: '0.75rem' }}>
          Used for map markers, route polylines, and day dot indicators. From <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>src/utils/dayColors.ts</code>.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {DAY_COLORS.map(({ day, label, hex }) => (
            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 4,
                  backgroundColor: hex,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--cds-text-secondary, #525252)', textAlign: 'center' }}>{label}</span>
              <code style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary, #525252)' }}>{hex}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Do / Don't */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-secondary, #525252)', margin: '0 0 0.75rem' }}>
          Rules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'var(--cds-layer-01, #f4f4f4)', border: '1px solid var(--cds-border-subtle, #e0e0e0)', borderRadius: 4, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#24a148', marginBottom: '0.5rem' }}>✓ Do</div>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 12, color: 'var(--cds-text-secondary, #525252)', lineHeight: 1.7 }}>
              <li>Use <code>$token</code> in <code>.module.scss</code></li>
              <li>Use <code>var(--cds-token, fallback)</code> in globals & inline</li>
              <li>Use <code>getDayColor(n)</code> for map elements</li>
            </ul>
          </div>
          <div style={{ background: 'var(--cds-layer-01, #f4f4f4)', border: '1px solid var(--cds-border-subtle, #e0e0e0)', borderRadius: 4, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#da1e28', marginBottom: '0.5rem' }}>✗ Don't</div>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 12, color: 'var(--cds-text-secondary, #525252)', lineHeight: 1.7 }}>
              <li>Hardcode hex (<code>#0f62fe</code>, <code>#ffffff</code>)</li>
              <li>Mix Tailwind, Material, or custom tokens</li>
              <li>Use <code>rgba()</code> without a token fallback</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ColorPalette> = {
  title: 'Foundations/Colors',
  component: ColorPalette,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'IBM Carbon Design System color tokens used in Trip Planner.',
      },
    },
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPalette>;

export const Palette: Story = {
  name: 'Color Palette',
};
