import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form, FormGroup, TextInput, TextArea, Select, SelectItem, Stack } from '@carbon/react';

function FormGroupDemo() {
  return (
    <Form style={{ maxWidth: 480 }}>
      <FormGroup legendText="Basic Information">
        <Stack gap={5}>
          <TextInput id="fg-title" labelText="Plan Title *" placeholder="Enter trip plan title" />
          <TextArea id="fg-desc" labelText="Description" placeholder="Enter description" rows={3} />
        </Stack>
      </FormGroup>
      <FormGroup legendText="Transport Information">
        <Stack gap={5}>
          <Select id="fg-type" labelText="Transport Type *">
            <SelectItem value="walking" text="Walking" />
            <SelectItem value="car" text="Car" />
            <SelectItem value="public-transport" text="Public Transport" />
          </Select>
          <TextArea id="fg-notes" labelText="Notes" placeholder="Optional notes" rows={2} />
        </Stack>
      </FormGroup>
    </Form>
  );
}

const meta: Meta<typeof FormGroupDemo> = {
  title: 'Primitives/FormGroup',
  component: FormGroupDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon `Form` + `FormGroup` for grouping related form fields with a legend. Used in TripPlanFormModal and TransportFormModal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormGroupDemo>;

export const Default: Story = {};
