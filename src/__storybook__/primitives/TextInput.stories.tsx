import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput } from '@carbon/react';

const meta: Meta<typeof TextInput> = {
  title: 'Primitives/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon `TextInput` for single-line text entry. Used in all forms across the app (plan title, location name, search).',
      },
    },
  },
  argTypes: {
    labelText: { control: 'text', table: { category: 'Data' } },
    placeholder: { control: 'text', table: { category: 'Data' } },
    helperText: { control: 'text', table: { category: 'Data' } },
    value: { control: 'text', table: { category: 'Data' } },
    invalid: { control: 'boolean', table: { category: 'States' } },
    invalidText: { control: 'text', table: { category: 'States' } },
    disabled: { control: 'boolean', table: { category: 'States' } },
    readOnly: { control: 'boolean', table: { category: 'States' } },
    size: { control: 'select', options: ['sm', 'md', 'lg'], table: { category: 'Appearance' } },
  },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: {
    id: 'default-input',
    labelText: 'Location Name',
    placeholder: 'Enter location name',
  },
};

export const WithValue: Story = {
  args: {
    id: 'with-value',
    labelText: 'Plan Title',
    value: 'Kraków Weekend',
  },
};

export const WithHelper: Story = {
  args: {
    id: 'with-helper',
    labelText: 'Location Name',
    placeholder: 'Enter location name',
    helperText: 'This will appear on the map marker',
  },
};

export const Invalid: Story = {
  args: {
    id: 'invalid-input',
    labelText: 'Plan Title *',
    value: '',
    invalid: true,
    invalidText: 'Title is required',
  },
};

export const Disabled: Story = {
  args: {
    id: 'disabled-input',
    labelText: 'Location Name',
    value: 'Wawel Castle',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    id: 'readonly-input',
    labelText: 'Location Name',
    value: 'Wawel Castle',
    readOnly: true,
  },
};

export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 400 }}>
      <TextInput id="s1" labelText="Default" placeholder="Enter text..." />
      <TextInput id="s2" labelText="With Value" value="Kraków Weekend" />
      <TextInput id="s3" labelText="With Helper" placeholder="Enter text..." helperText="Helper text goes here" />
      <TextInput id="s4" labelText="Invalid" value="" invalid invalidText="This field is required" />
      <TextInput id="s5" labelText="Disabled" value="Locked value" disabled />
      <TextInput id="s6" labelText="Read Only" value="Read-only value" readOnly />
    </div>
  ),
};
