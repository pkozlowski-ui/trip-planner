import type { Meta, StoryObj } from '@storybook/react-vite';
import TransportFormModal from './TransportFormModal';

const meta: Meta<typeof TransportFormModal> = {
  title: 'Components/Modals/TransportFormModal',
  component: TransportFormModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Modal form for adding/editing transport between locations. Includes type selector and auto-calculation note.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Modal`, `Select`, `SelectItem`, `TextArea`, `Form`, `FormGroup`, `Loading`',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    open: { control: 'boolean', table: { category: 'States' } },
    isEditMode: { control: 'boolean', table: { category: 'States' } },
    isSubmitting: { control: 'boolean', table: { category: 'States' } },
    onClose: { action: 'close', table: { category: 'Events' } },
    onSubmit: { action: 'submit', table: { category: 'Events' } },
  },
};

export default meta;
type Story = StoryObj<typeof TransportFormModal>;

export const CreateMode: Story = {
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: false,
    onSubmit: async () => {},
  },
};

export const EditMode: Story = {
  args: {
    open: true,
    isEditMode: true,
    isSubmitting: false,
    initialData: {
      type: 'public-transport',
      notes: 'Take tram #3 from Plac Bohaterów',
    },
    onSubmit: async () => {},
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: true,
    onSubmit: async () => {},
  },
};
