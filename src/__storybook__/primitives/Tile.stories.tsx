import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tile, ClickableTile } from '@carbon/react';

const meta: Meta<typeof Tile> = {
  title: 'Primitives/Tile',
  component: Tile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Carbon `Tile` and `ClickableTile`. Used as the base for LocationCard, TransportCard, and dashboard trip cards.',
          '',
          'In this app, Tile receives custom CSS classes from `carbon-overrides.scss` for card styling.',
        ].join('\n'),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tile>;

export const Default: Story = {
  render: () => (
    <Tile style={{ maxWidth: 300 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Basic Tile</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
        Static container for grouping related content.
      </p>
    </Tile>
  ),
};

export const Clickable: Story = {
  render: () => (
    <ClickableTile style={{ maxWidth: 300 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Clickable Tile</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
        Interactive tile that responds to click.
      </p>
    </ClickableTile>
  ),
};

export const AsLocationCard: Story = {
  name: 'As Location Card (styled)',
  render: () => (
    <Tile className="location-card" style={{ maxWidth: 320 }}>
      <div className="location-card__body">
        <div className="location-card__title-row">
          <div className="location-card__icon-box">
            <span style={{ fontSize: 20 }}>📍</span>
          </div>
          <h5 className="location-card__title">Wawel Castle</h5>
        </div>
        <div className="location-card__meta-stack">
          <span className="location-card__meta-item">attraction</span>
          <span className="location-card__meta-item">9:00-17:00</span>
        </div>
      </div>
    </Tile>
  ),
};

export const AsTransportCard: Story = {
  name: 'As Transport Card (styled)',
  render: () => (
    <Tile className="transport-card" style={{ maxWidth: 320 }}>
      <span style={{ color: '#0f62fe' }}>🚶</span>
      <div className="transport-card__label">Walking</div>
      <div className="transport-card__meta">
        <span>1.2 km</span>
        <span> • </span>
        <span>15 min</span>
      </div>
    </Tile>
  ),
};
