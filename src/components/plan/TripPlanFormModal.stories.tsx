import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import TripPlanFormModal from './TripPlanFormModal';

const meta: Meta<typeof TripPlanFormModal> = {
  title: 'Components/Modals/TripPlanFormModal',
  component: TripPlanFormModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Modal form for creating/editing a trip plan. Includes date pickers and optional delete action.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Modal`, `TextInput`, `TextArea`, `Form`, `FormGroup`, `DatePicker`, `DatePickerInput`, `Loading`, `Button`',
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
type Story = StoryObj<typeof TripPlanFormModal>;

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
      title: 'Kraków Weekend',
      description: 'A 3-day trip exploring the best of Kraków',
      startDate: new Date('2025-07-10'),
      endDate: new Date('2025-07-12'),
    },
    onSubmit: async () => {},
  },
};

export const WithDelete: Story = {
  name: 'Edit Mode with Delete',
  args: {
    open: true,
    isEditMode: true,
    planId: 'plan-1',
    onDeletePlan: async () => {},
    initialData: {
      title: 'Old Trip Plan',
      description: 'This trip is complete.',
    },
    onSubmit: async () => {},
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: true,
    initialData: { title: 'My Trip' },
    onSubmit: async () => {},
  },
};

export const ValidationTest: Story = {
  name: 'Play: Empty Title Disables Submit',
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: false,
    onSubmit: async () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titleInput = canvas.getByLabelText(/Plan Title/i);
    await expect(titleInput).toHaveValue('');
    const createButton = canvas.getByText('Create Plan');
    await expect(createButton).toBeDisabled();
  },
};

export const FillAndEnable: Story = {
  name: 'Play: Typing Title Enables Submit',
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: false,
    onSubmit: async () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titleInput = canvas.getByLabelText(/Plan Title/i);
    await userEvent.type(titleInput, 'My Summer Trip');
    await expect(titleInput).toHaveValue('My Summer Trip');
    const createButton = canvas.getByText('Create Plan');
    await expect(createButton).toBeEnabled();
  },
};
