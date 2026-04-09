import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loading } from '@carbon/react';

const meta: Meta<typeof Loading> = {
  title: 'Primitives/Loading',
  component: Loading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Carbon `Loading` spinner. **Never use text-only loading** ("Loading...") -- always use this component.',
          '',
          'Variants: full-page overlay, inline (beside content), small (inside buttons/rows).',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    withOverlay: { control: 'boolean', table: { category: 'Appearance' } },
    small: { control: 'boolean', table: { category: 'Appearance' } },
    description: { control: 'text', table: { category: 'Accessibility' } },
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {
  args: { description: 'Loading...', withOverlay: false },
};

export const Small: Story = {
  args: { description: 'Loading...', withOverlay: false, small: true },
};

export const InlineWithText: Story = {
  name: 'Inline with Text',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Loading description="Searching..." withOverlay={false} small />
      <span style={{ fontSize: '14px', color: 'var(--cds-text-secondary)' }}>Searching...</span>
    </div>
  ),
};

export const CenteredContainer: Story = {
  name: 'Centered in Container',
  render: () => (
    <div style={{
      height: 240,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed var(--cds-border-subtle)',
      borderRadius: 4,
    }}>
      <Loading description="Loading trip plan..." withOverlay={false} />
    </div>
  ),
};
