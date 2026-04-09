import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { InlineNotification, ToastNotification } from '@carbon/react';

const InlineNotificationMeta: Meta = {
  title: 'Primitives/Notification',
  component: InlineNotification as any,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Carbon notifications for user feedback.',
          '',
          '- **InlineNotification**: contextual, in-page feedback (e.g. form errors, status updates)',
          '- **ToastNotification**: global, ephemeral feedback (e.g. "Location added")',
          '',
          '**Hierarchy**: Error (stays) > Warning (5s) > Success (3s) > Info (4s)',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    kind: {
      control: 'select',
      options: ['error', 'warning', 'success', 'info'],
      table: { category: 'Appearance' },
    },
    title: { control: 'text', table: { category: 'Data' } },
    subtitle: { control: 'text', table: { category: 'Data' } },
    lowContrast: { control: 'boolean', table: { category: 'Appearance' } },
    hideCloseButton: { control: 'boolean', table: { category: 'Appearance' } },
  },
};

export default InlineNotificationMeta;
type Story = StoryObj<typeof InlineNotification>;

export const Error: Story = {
  args: {
    kind: 'error',
    title: 'Error',
    subtitle: 'Unable to save location. Please check your connection and try again.',
    hideCloseButton: false,
  },
};

export const Warning: Story = {
  args: {
    kind: 'warning',
    title: 'Warning',
    subtitle: 'Your session will expire in 5 minutes.',
    lowContrast: true,
  },
};

export const Success: Story = {
  args: {
    kind: 'success',
    title: 'Success',
    subtitle: 'Trip plan created successfully.',
    lowContrast: true,
  },
};

export const Info: Story = {
  args: {
    kind: 'info',
    title: 'Info',
    subtitle: 'Click on the map to add a new location.',
    lowContrast: true,
  },
};

export const AllKinds: Story = {
  name: 'All Kinds',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
      <InlineNotification kind="error" title="Error" subtitle="Unable to delete location." />
      <InlineNotification kind="warning" title="Warning" subtitle="Unsaved changes will be lost." lowContrast />
      <InlineNotification kind="success" title="Success" subtitle="Plan saved." lowContrast />
      <InlineNotification kind="info" title="Info" subtitle="Drag locations to reorder." lowContrast />
    </div>
  ),
};

export const Toast: Story = {
  name: 'Toast Notification',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ToastNotification kind="success" title="Location added" subtitle="Wawel Castle added to Day 1" timeout={0} />
      <ToastNotification kind="error" title="Error" subtitle="Failed to save changes" timeout={0} />
    </div>
  ),
};

export const ErrorHasCloseButton: Story = {
  name: 'Play: Error Has Close Button',
  args: {
    kind: 'error',
    title: 'Error',
    subtitle: 'Connection failed.',
    hideCloseButton: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const closeButton = canvas.getByRole('button', { name: /close/i });
    await expect(closeButton).toBeInTheDocument();
  },
};
