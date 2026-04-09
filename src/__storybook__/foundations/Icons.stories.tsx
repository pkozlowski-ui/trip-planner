import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Add, ArrowLeft, ArrowRight, Building, Bus, Cafe, Car, Chat,
  Checkmark, ChevronDown, ChevronLeft, ChevronRight, CircleFilled,
  Cloudy, DiamondOutline, Document, Edit, Events, Gem, Hotel, Idea,
  Image, Link, Location, Mountain, OverflowMenuVertical, Pedestrian,
  Phone, Plane, Receipt, Restaurant, Search, Send, ShoppingBag,
  ShoppingCart, Star, Store, Time, Train, TrashCan, Tree, Video, View,
  Wallet,
} from '@carbon/icons-react';

const ALL_ICONS = {
  Add, ArrowLeft, ArrowRight, Building, Bus, Cafe, Car, Chat,
  Checkmark, ChevronDown, ChevronLeft, ChevronRight, CircleFilled,
  Cloudy, DiamondOutline, Document, Edit, Events, Gem, Hotel, Idea,
  Image, Link, Location, Mountain, OverflowMenuVertical, Pedestrian,
  Phone, Plane, Receipt, Restaurant, Search, Send, ShoppingBag,
  ShoppingCart, Star, Store, Time, Train, TrashCan, Tree, Video, View,
  Wallet,
};

function IconCatalog({ size = 24 }: { size?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem' }}>
      {Object.entries(ALL_ICONS).map(([name, Icon]) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            border: '1px solid var(--cds-border-subtle)',
            borderRadius: '4px',
            background: 'var(--cds-layer-01)',
          }}
        >
          <Icon size={size} />
          <span style={{ fontSize: '11px', color: 'var(--cds-text-secondary)', textAlign: 'center' }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof IconCatalog> = {
  title: 'Foundations/Icons',
  component: IconCatalog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'All Carbon icons used across the Trip Planner app. Import from `@carbon/icons-react`.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: [16, 20, 24, 32],
      description: 'Icon size in pixels. Carbon standard sizes: 16, 20, 24, 32.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconCatalog>;

export const AllIcons: Story = {
  args: { size: 24 },
};

export const Small: Story = {
  args: { size: 16 },
};

export const Large: Story = {
  args: { size: 32 },
};
