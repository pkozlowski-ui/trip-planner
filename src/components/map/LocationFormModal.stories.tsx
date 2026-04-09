import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import LocationFormModal from './LocationFormModal';

const meta: Meta<typeof LocationFormModal> = {
  title: 'Components/Modals/LocationFormModal',
  component: LocationFormModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Modal form for adding/editing a location. Includes category picker grid, Wikidata enrichment, and validation.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Modal`, `TextInput`, `TextArea`, `Stack`, `Loading`',
          '',
          '**Related**: LocationCard, MapView',
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
type Story = StoryObj<typeof LocationFormModal>;

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
      name: 'Wawel Royal Castle',
      category: 'attraction',
      dayId: 'day-1',
      description: 'Historic royal residence and UNESCO World Heritage Site.',
      rating: 4.8,
      openingHours: '9:00-17:00',
    },
    onSubmit: async () => {},
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: true,
    initialData: { name: 'Wawel Castle', category: 'attraction', dayId: 'day-1' },
    onSubmit: async () => {},
  },
};

export const WithMetadata: Story = {
  name: 'With Rating & Hours',
  args: {
    open: true,
    isEditMode: true,
    initialData: {
      name: 'Pod Wawelem',
      category: 'restaurant',
      dayId: 'day-1',
      rating: 4.2,
      openingHours: '12:00-23:00',
    },
    onSubmit: async () => {},
  },
};

export const ValidationTest: Story = {
  name: 'Play: Empty Name Disables Submit',
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: false,
    onSubmit: async () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByLabelText(/Location Name/i);
    await expect(nameInput).toHaveValue('');
    const addButton = canvas.getByRole('button', { name: /Add Location/i });
    await expect(addButton).toBeDisabled();
  },
};

export const TypeAndEnable: Story = {
  name: 'Play: Typing Name Enables Submit',
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: false,
    onSubmit: async () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByLabelText(/Location Name/i);
    await userEvent.type(nameInput, 'Wawel Castle');
    await expect(nameInput).toHaveValue('Wawel Castle');
    const addButton = canvas.getByRole('button', { name: /Add Location/i });
    await expect(addButton).toBeEnabled();
  },
};

export const CategorySelection: Story = {
  name: 'Play: Select Category',
  args: {
    open: true,
    isEditMode: false,
    isSubmitting: false,
    onSubmit: async () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restaurantButton = canvas.getByText('Restaurant');
    await userEvent.click(restaurantButton);
    await expect(restaurantButton.closest('button')).toHaveAttribute('aria-pressed', 'true');
  },
};
