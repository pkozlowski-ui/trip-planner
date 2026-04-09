import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageWithPlaceholder } from './ImageWithPlaceholder';

const meta: Meta<typeof ImageWithPlaceholder> = {
  title: 'Components/UI Utilities/ImageWithPlaceholder',
  component: ImageWithPlaceholder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Image loader with Carbon `SkeletonPlaceholder` while loading and fade-in on load.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `SkeletonPlaceholder`',
          '',
          '**Used in**: LocationCard (thumbnail), LocationPopup',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    src: { control: 'text', table: { category: 'Data' } },
    alt: { control: 'text', table: { category: 'Accessibility' } },
    width: { control: 'number', table: { category: 'Appearance' } },
    height: { control: 'number', table: { category: 'Appearance' } },
    objectFit: { control: 'select', options: ['cover', 'contain', 'fill', 'none'], table: { category: 'Appearance' } },
    loading: { control: 'select', options: ['lazy', 'eager'], table: { category: 'Appearance' } },
  },
};

export default meta;
type Story = StoryObj<typeof ImageWithPlaceholder>;

export const Default: Story = {
  args: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/320px-Wawel_castle.jpg',
    alt: 'Wawel Castle',
    width: 200,
    height: 150,
  },
};

export const Thumbnail: Story = {
  args: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/320px-Wawel_castle.jpg',
    alt: 'Thumbnail',
    width: 48,
    height: 48,
  },
};

export const BrokenImage: Story = {
  name: 'Error (broken URL)',
  args: {
    src: 'https://example.com/nonexistent.jpg',
    alt: 'Broken image',
    width: 200,
    height: 150,
  },
};

export const EmptySrc: Story = {
  name: 'Empty Source (renders null)',
  args: {
    src: '',
    alt: 'No image',
    width: 200,
    height: 150,
  },
};
