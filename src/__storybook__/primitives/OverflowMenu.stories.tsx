import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { OverflowMenuVertical } from '@carbon/icons-react';

function OverflowMenuDemo({ withDelete = true }: { withDelete?: boolean }) {
  return (
    <OverflowMenu
      renderIcon={OverflowMenuVertical}
      size="sm"
      flipped
      ariaLabel="Actions"
    >
      <OverflowMenuItem itemText="Edit" />
      <OverflowMenuItem itemText="Duplicate" />
      {withDelete && (
        <OverflowMenuItem itemText="Delete" isDelete hasDivider />
      )}
    </OverflowMenu>
  );
}

const meta: Meta<typeof OverflowMenuDemo> = {
  title: 'Primitives/OverflowMenu',
  component: OverflowMenuDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon `OverflowMenu` for contextual actions on cards and rows. Used in LocationCard, TransportCard.',
      },
    },
  },
  argTypes: {
    withDelete: { control: 'boolean', table: { category: 'Appearance' } },
  },
};

export default meta;
type Story = StoryObj<typeof OverflowMenuDemo>;

export const Default: Story = {
  args: { withDelete: true },
};

export const WithoutDelete: Story = {
  args: { withDelete: false },
};
