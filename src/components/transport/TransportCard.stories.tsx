import type { Meta, StoryObj } from '@storybook/react-vite';
import TransportCard from './TransportCard';
import { mockTransportCar, mockTransportWalking, mockTransportPublic } from '../../__storybook__/mockData';

const meta: Meta<typeof TransportCard> = {
  title: 'Components/Cards/TransportCard',
  component: TransportCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Displays transport between two locations. Built on Carbon `Tile` with `OverflowMenu`.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Tile`, `OverflowMenu`, `OverflowMenuItem`',
          '',
          '**Related**: LocationCard, DaySection',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    transport: { table: { category: 'Data' } },
    dayNumber: { control: { type: 'number', min: 1, max: 10 }, table: { category: 'Data' } },
    fromLocationName: { control: 'text', table: { category: 'Data' } },
    toLocationName: { control: 'text', table: { category: 'Data' } },
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
type Story = StoryObj<typeof TransportCard>;

export const Car: Story = {
  args: {
    transport: mockTransportCar,
    dayNumber: 1,
    fromLocationName: 'Wawel Castle',
    toLocationName: 'Main Market Square',
  },
};

export const Walking: Story = {
  args: {
    transport: mockTransportWalking,
    dayNumber: 2,
    fromLocationName: 'Main Market Square',
    toLocationName: 'Kazimierz District',
  },
};

export const PublicTransport: Story = {
  args: {
    transport: mockTransportPublic,
    dayNumber: 1,
    fromLocationName: 'Kazimierz',
    toLocationName: 'Pod Wawelem',
  },
};

export const WithoutActions: Story = {
  args: {
    transport: mockTransportWalking,
    dayNumber: 1,
    fromLocationName: 'A',
    toLocationName: 'B',
    onEdit: undefined,
    onDelete: undefined,
  },
};

export const AllTypes: Story = {
  name: 'All Transport Types',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <TransportCard transport={mockTransportCar} dayNumber={1} fromLocationName="A" toLocationName="B" onEdit={() => {}} onDelete={() => {}} />
      <TransportCard transport={mockTransportWalking} dayNumber={2} fromLocationName="B" toLocationName="C" onEdit={() => {}} onDelete={() => {}} />
      <TransportCard transport={mockTransportPublic} dayNumber={3} fromLocationName="C" toLocationName="D" onEdit={() => {}} onDelete={() => {}} />
      <TransportCard transport={{ ...mockTransportCar, id: 'tr-bike', type: 'bike', distance: 5.3, time: '22 min' }} dayNumber={4} fromLocationName="D" toLocationName="E" onEdit={() => {}} onDelete={() => {}} />
    </div>
  ),
};
