import type { Meta, StoryObj } from '@storybook/react-vite';
import LocationCard from './LocationCard';
import {
  mockLocation,
  mockLocationWithMedia,
  mockLocationNoImage,
  mockLocationRestaurant,
} from '../../__storybook__/mockData';

const meta: Meta<typeof LocationCard> = {
  title: 'Components/Cards/LocationCard',
  component: LocationCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Displays a location/POI in the sidebar. Built on Carbon `Tile` with `OverflowMenu` for actions.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Tile`, `OverflowMenu`, `OverflowMenuItem`',
          '',
          '**Related**: ImageWithPlaceholder, TransportCard, DaySection',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    location: { table: { category: 'Data' } },
    isHighlighted: { control: 'boolean', table: { category: 'States' }, description: 'Visually highlights the card (e.g. when selected on map)' },
    onClick: { action: 'click', table: { category: 'Events' } },
    onEdit: { action: 'edit', table: { category: 'Events' } },
    onDelete: { action: 'delete', table: { category: 'Events' } },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 340, padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LocationCard>;

export const Default: Story = {
  args: {
    location: mockLocation,
    onEdit: undefined,
    onDelete: undefined,
  },
};

export const WithActions: Story = {
  args: {
    location: mockLocation,
  },
};

export const Highlighted: Story = {
  args: {
    location: mockLocation,
    isHighlighted: true,
  },
};

export const WithMedia: Story = {
  name: 'With Media Counts',
  args: {
    location: mockLocationWithMedia,
  },
};

export const NoImage: Story = {
  name: 'No Image (Icon Fallback)',
  args: {
    location: mockLocationNoImage,
  },
};

export const Restaurant: Story = {
  name: 'Restaurant Category',
  args: {
    location: mockLocationRestaurant,
  },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <LocationCard location={mockLocation} onEdit={() => {}} onDelete={() => {}} />
      <LocationCard location={mockLocation} isHighlighted onEdit={() => {}} onDelete={() => {}} />
      <LocationCard location={mockLocationNoImage} onEdit={() => {}} onDelete={() => {}} />
      <LocationCard location={mockLocationRestaurant} onEdit={() => {}} onDelete={() => {}} />
      <LocationCard location={mockLocationWithMedia} onEdit={() => {}} onDelete={() => {}} />
    </div>
  ),
};
