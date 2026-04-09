import type { Meta, StoryObj } from '@storybook/react-vite';
import ChatPlaceTiles, { type ChatPlaceSummary } from './ChatPlaceTiles';
import { ChatMapProvider } from '../../contexts/ChatMapContext';

const mockPlaces: ChatPlaceSummary[] = [
  { name: 'Wawel Castle', lat: 50.054, lng: 19.935, type: 'attraction', rating: 4.8 },
  { name: 'Sukiennice', lat: 50.061, lng: 19.937, type: 'museum', rating: 4.5 },
  { name: 'Kazimierz District', lat: 50.051, lng: 19.944, type: 'city' },
  { name: 'Planty Park', lat: 50.063, lng: 19.935, type: 'park', rating: 4.3 },
];

const noop = () => {};

const meta: Meta<typeof ChatPlaceTiles> = {
  title: 'Components/Chat/ChatPlaceTiles',
  component: ChatPlaceTiles,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Read-only place tiles rendered in AI chat responses. Clicking a tile highlights the location on the map.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Tile`, `Star` icon',
          '',
          '**Context**: Requires `ChatMapContext` for map interaction.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <ChatMapProvider showLocationOnMap={noop}>
        <div style={{ maxWidth: 420, padding: '1rem', background: 'var(--cds-layer-01)' }}>
          <Story />
        </div>
      </ChatMapProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatPlaceTiles>;

export const Default: Story = {
  args: {
    places: mockPlaces,
  },
};

export const SinglePlace: Story = {
  args: {
    places: [mockPlaces[0]],
  },
};

export const ManyPlaces: Story = {
  args: {
    places: [
      ...mockPlaces,
      { name: 'St. Mary\'s Basilica', lat: 50.061, lng: 19.939, type: 'attraction', rating: 4.9 },
      { name: 'Nowa Huta', lat: 50.072, lng: 20.037, type: 'city' },
    ],
  },
};

export const EmptyList: Story = {
  name: 'Empty (renders null)',
  args: {
    places: [],
  },
};
