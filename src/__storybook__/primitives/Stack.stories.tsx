import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, TextInput, TextArea, Select, SelectItem } from '@carbon/react';

function StackDemo({ gap = 5 }: { gap?: number }) {
  return (
    <Stack gap={gap} style={{ maxWidth: 400 }}>
      <TextInput id="st-1" labelText="Name" placeholder="Enter name" />
      <Select id="st-2" labelText="Category">
        <SelectItem value="city" text="City" />
        <SelectItem value="attraction" text="Attraction" />
      </Select>
      <TextArea id="st-3" labelText="Description" placeholder="Optional" rows={3} />
    </Stack>
  );
}

const meta: Meta<typeof StackDemo> = {
  title: 'Primitives/Stack',
  component: StackDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Carbon `Stack` for vertical spacing between form elements.',
          '',
          'Gap values map to Carbon spacing tokens: `gap={5}` = `$spacing-05` (1rem), `gap={6}` = `$spacing-06` (1.5rem).',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    gap: {
      control: { type: 'range', min: 1, max: 10, step: 1 },
      description: 'Spacing scale value (maps to $spacing-{n})',
      table: { category: 'Appearance' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StackDemo>;

export const Default: Story = {
  args: { gap: 5 },
};

export const Tight: Story = {
  args: { gap: 3 },
};

export const Wide: Story = {
  args: { gap: 7 },
};

export const GapScale: Story = {
  name: 'Gap Scale Visual',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {[2, 3, 4, 5, 6, 7].map((g) => (
        <div key={g}>
          <p style={{ margin: '0 0 0.5rem', fontSize: 12, color: 'var(--cds-text-secondary)' }}>
            gap={g} ($spacing-0{g})
          </p>
          <Stack gap={g}>
            <div style={{ height: 32, background: 'var(--cds-layer-accent-01)', borderRadius: 4, padding: '0.5rem', fontSize: 12 }}>Item A</div>
            <div style={{ height: 32, background: 'var(--cds-layer-accent-01)', borderRadius: 4, padding: '0.5rem', fontSize: 12 }}>Item B</div>
            <div style={{ height: 32, background: 'var(--cds-layer-accent-01)', borderRadius: 4, padding: '0.5rem', fontSize: 12 }}>Item C</div>
          </Stack>
        </div>
      ))}
    </div>
  ),
};
