import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker, DatePickerInput } from '@carbon/react';

function DatePickerDemo({ disabled = false }: { disabled?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 500 }}>
      <DatePicker datePickerType="single">
        <DatePickerInput
          id="start-date"
          labelText="Start Date"
          placeholder="mm/dd/yyyy"
          disabled={disabled}
        />
      </DatePicker>
      <DatePicker datePickerType="single">
        <DatePickerInput
          id="end-date"
          labelText="End Date"
          placeholder="mm/dd/yyyy"
          disabled={disabled}
        />
      </DatePicker>
    </div>
  );
}

const meta: Meta<typeof DatePickerDemo> = {
  title: 'Primitives/DatePicker',
  component: DatePickerDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon `DatePicker` with `DatePickerInput`. Used in TripPlanFormModal for optional start/end dates.',
      },
    },
  },
  argTypes: {
    disabled: { control: 'boolean', table: { category: 'States' } },
  },
};

export default meta;
type Story = StoryObj<typeof DatePickerDemo>;

export const Default: Story = {
  args: { disabled: false },
};

export const Disabled: Story = {
  args: { disabled: true },
};
