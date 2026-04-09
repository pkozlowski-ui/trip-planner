import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@carbon/react';
import { Add, TrashCan, Edit } from '@carbon/icons-react';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Carbon `Button` component. Used for all interactive actions in the app.',
          '',
          '**Hierarchy**: Primary (1 per section) > Secondary > Tertiary > Ghost > Danger',
          '',
          'Carbon dependency: `@carbon/react`',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    kind: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'ghost', 'danger', 'danger--ghost', 'danger--tertiary'],
      table: { category: 'Appearance' },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      table: { category: 'Appearance' },
    },
    disabled: {
      control: 'boolean',
      table: { category: 'States' },
    },
    children: {
      control: 'text',
      table: { category: 'Data' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { kind: 'primary', children: 'Create Plan', size: 'md' },
};

export const Secondary: Story = {
  args: { kind: 'secondary', children: 'Add to plan', size: 'sm' },
};

export const Tertiary: Story = {
  args: { kind: 'tertiary', children: 'View Details', size: 'md' },
};

export const Ghost: Story = {
  args: { kind: 'ghost', children: 'Cancel', size: 'md' },
};

export const Danger: Story = {
  args: { kind: 'danger', children: 'Delete Plan', size: 'md' },
};

export const DangerGhost: Story = {
  name: 'Danger Ghost',
  args: { kind: 'danger--ghost', children: 'Delete plan', size: 'sm', renderIcon: TrashCan, iconDescription: 'Delete' },
};

export const WithIcon: Story = {
  args: { kind: 'primary', children: 'New Plan', renderIcon: Add, iconDescription: 'Add', size: 'md' },
};

export const IconOnly: Story = {
  args: { kind: 'ghost', renderIcon: Edit, iconDescription: 'Edit location', hasIconOnly: true, size: 'md' },
};

export const AllKinds: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button kind="primary" renderIcon={Add} iconDescription="Add">Primary</Button>
      <Button kind="secondary">Secondary</Button>
      <Button kind="tertiary">Tertiary</Button>
      <Button kind="ghost">Ghost</Button>
      <Button kind="danger" renderIcon={TrashCan} iconDescription="Delete">Danger</Button>
      <Button kind="danger--ghost" renderIcon={TrashCan} iconDescription="Delete">Danger Ghost</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium (default)</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XL</Button>
      <Button size="2xl">2XL</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { kind: 'primary', children: 'Cannot Click', disabled: true },
};

export const SubmittingState: Story = {
  name: 'Submitting State',
  render: () => (
    <Button kind="primary" disabled>Creating...</Button>
  ),
};
