import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoverWithPlaceholder } from './CoverWithPlaceholder';

const meta: Meta<typeof CoverWithPlaceholder> = {
  title: 'Components/UI Utilities/CoverWithPlaceholder',
  component: CoverWithPlaceholder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Cover image with skeleton placeholder and fade-in. Used for dashboard trip cards and map popup headers.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `SkeletonPlaceholder`',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    coverUrl: { control: 'text', table: { category: 'Data' } },
    className: { control: 'text', table: { category: 'Appearance' } },
    aspectRatio: { control: 'text', table: { category: 'Appearance' } },
  },
};

export default meta;
type Story = StoryObj<typeof CoverWithPlaceholder>;

export const Default: Story = {
  args: {
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/640px-Wawel_castle.jpg',
    className: 'trip-plan-card__media',
    aspectRatio: '62%',
  },
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};

export const NoCover: Story = {
  name: 'No Cover (fallback gradient)',
  args: {
    coverUrl: null,
    fallbackStyle: { background: 'linear-gradient(135deg, #0f62fe 0%, #8a3ffc 100%)' },
    aspectRatio: '62%',
  },
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};

export const Loading: Story = {
  name: 'Loading (skeleton)',
  args: {
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/640px-Wawel_castle.jpg',
    aspectRatio: '62%',
  },
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};
