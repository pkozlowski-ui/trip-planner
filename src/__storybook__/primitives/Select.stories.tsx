import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SelectItem } from '@carbon/react';

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon `Select` dropdown. Used for category pickers and transport type selection.',
      },
    },
  },
  argTypes: {
    labelText: { control: 'text', table: { category: 'Data' } },
    helperText: { control: 'text', table: { category: 'Data' } },
    invalid: { control: 'boolean', table: { category: 'States' } },
    invalidText: { control: 'text', table: { category: 'States' } },
    disabled: { control: 'boolean', table: { category: 'States' } },
    size: { control: 'select', options: ['sm', 'md', 'lg'], table: { category: 'Appearance' } },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    id: 'transport-type',
    labelText: 'Transport Type',
  },
  render: (args) => (
    <Select {...args}>
      <SelectItem value="walking" text="Walking" />
      <SelectItem value="car" text="Car" />
      <SelectItem value="public-transport" text="Public Transport" />
      <SelectItem value="bike" text="Bike" />
    </Select>
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <Select id="category" labelText="Category">
      <SelectItem value="" text="Choose a category" />
      <SelectItem value="city" text="City" />
      <SelectItem value="attraction" text="Attraction" />
      <SelectItem value="restaurant" text="Restaurant" />
      <SelectItem value="hotel" text="Hotel" />
      <SelectItem value="park" text="Park" />
      <SelectItem value="museum" text="Museum" />
    </Select>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Select id="invalid-select" labelText="Category" invalid invalidText="Please select a category">
      <SelectItem value="" text="Choose a category" />
      <SelectItem value="city" text="City" />
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select id="disabled-select" labelText="Transport Type" disabled>
      <SelectItem value="walking" text="Walking" />
    </Select>
  ),
};
