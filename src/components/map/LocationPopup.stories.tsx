import type { Meta, StoryObj } from '@storybook/react-vite';
import LocationPopup from './LocationPopup';
import { mockLocation, mockLocationNoImage, mockLocationWithMedia } from '../../__storybook__/mockData';

const meta: Meta<typeof LocationPopup> = {
  title: 'Components/Map/LocationPopup',
  component: LocationPopup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Popup displayed when clicking a map marker. Shows location image, metadata, description, and video thumbnails.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: icons only (`Star`, `Time`, `Video`)',
          '',
          '**Related**: LocationMarker, CoverWithPlaceholder, ImageWithPlaceholder',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 300, border: '1px solid var(--cds-border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--cds-layer-01)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LocationPopup>;

export const Default: Story = {
  args: {
    location: mockLocation,
    dayNumber: 1,
    order: 1,
    dayColor: '#0f62fe',
    popupImageLoading: false,
  },
};

export const NoImage: Story = {
  args: {
    location: mockLocationNoImage,
    dayNumber: 2,
    order: 3,
    dayColor: '#24a148',
    popupImageLoading: false,
  },
};

export const ImageLoading: Story = {
  name: 'Image Loading',
  args: {
    location: { ...mockLocation, image: undefined },
    dayNumber: 1,
    order: 1,
    dayColor: '#0f62fe',
    popupImage: undefined,
    popupImageLoading: true,
  },
};

export const WithVideo: Story = {
  args: {
    location: {
      ...mockLocationWithMedia,
      media: [
        { id: 'v1', type: 'youtube' as const, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Walking Tour', createdAt: new Date() },
        { id: 'v2', type: 'youtube' as const, url: 'https://www.youtube.com/watch?v=abc123', title: 'Drone View', createdAt: new Date() },
      ],
    },
    dayNumber: 1,
    order: 2,
    dayColor: '#0f62fe',
    popupImageLoading: false,
  },
};
