import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal, TextInput, TextArea, Stack, Loading } from '@carbon/react';

const meta: Meta<typeof Modal> = {
  title: 'Primitives/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Carbon `Modal` for focused tasks (forms, confirmations, details).',
          '',
          '**Sizes**: `xs` (confirm/alert), `sm` (simple forms), `md` (standard), `lg` (complex forms)',
          '',
          'Always provide both primary and secondary actions. Disable primary when form is invalid or submitting.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    open: { control: 'boolean', table: { category: 'States' } },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'], table: { category: 'Appearance' } },
    modalHeading: { control: 'text', table: { category: 'Data' } },
    modalLabel: { control: 'text', table: { category: 'Data' } },
    primaryButtonText: { control: 'text', table: { category: 'Data' } },
    secondaryButtonText: { control: 'text', table: { category: 'Data' } },
    danger: { control: 'boolean', table: { category: 'Appearance' } },
    primaryButtonDisabled: { control: 'boolean', table: { category: 'States' } },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    modalHeading: 'Add Location',
    modalLabel: 'Trip Planning',
    primaryButtonText: 'Add Location',
    secondaryButtonText: 'Cancel',
    size: 'md',
  },
  render: (args) => (
    <Modal {...args}>
      <Stack gap={6}>
        <TextInput id="m-name" labelText="Location Name *" placeholder="Enter location name" />
        <TextArea id="m-desc" labelText="Description" placeholder="Enter description" rows={3} />
      </Stack>
    </Modal>
  ),
};

export const SmallForm: Story = {
  name: 'Small (sm)',
  render: () => (
    <Modal
      open
      modalHeading="Create Trip Plan"
      modalLabel="Trip Plan Details"
      primaryButtonText="Create Plan"
      secondaryButtonText="Cancel"
      size="sm"
    >
      <Stack gap={5}>
        <TextInput id="sm-title" labelText="Plan Title *" placeholder="Enter trip plan title" />
        <TextArea id="sm-desc" labelText="Description" placeholder="Optional" rows={2} />
      </Stack>
    </Modal>
  ),
};

export const DangerConfirmation: Story = {
  name: 'Danger (Confirmation)',
  render: () => (
    <Modal
      open
      modalHeading="Delete trip plan?"
      modalLabel="Confirm"
      primaryButtonText="Delete"
      secondaryButtonText="Cancel"
      danger
      size="xs"
    >
      <p>This will permanently delete this plan and all its days and locations. This action cannot be undone.</p>
    </Modal>
  ),
};

export const WithLoading: Story = {
  name: 'Submitting State',
  render: () => (
    <Modal
      open
      modalHeading="Add Location"
      primaryButtonText="Adding..."
      secondaryButtonText="Cancel"
      primaryButtonDisabled
      size="md"
    >
      <Stack gap={6}>
        <TextInput id="ml-name" labelText="Location Name *" value="Wawel Castle" disabled />
        <TextArea id="ml-desc" labelText="Description" value="Historic castle..." disabled rows={3} />
      </Stack>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <Loading description="Adding location..." withOverlay={false} small />
      </div>
    </Modal>
  ),
};

export const LargeForm: Story = {
  name: 'Large (lg)',
  render: () => (
    <Modal
      open
      modalHeading="Edit Location"
      primaryButtonText="Update Location"
      secondaryButtonText="Cancel"
      size="lg"
    >
      <Stack gap={6}>
        <TextInput id="lg-name" labelText="Location Name *" value="Main Market Square" />
        <TextInput id="lg-web" labelText="Website" value="https://en.wikipedia.org/wiki/Main_Square" />
        <TextArea id="lg-desc" labelText="Description" value="The largest medieval town square in Europe." rows={4} />
      </Stack>
    </Modal>
  ),
};
