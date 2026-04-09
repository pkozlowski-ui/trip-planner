import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react';

function TabsDemo() {
  return (
    <Tabs>
      <TabList aria-label="Dashboard tabs">
        <Tab>All Plans</Tab>
        <Tab>Recent</Tab>
        <Tab>Shared</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <p style={{ padding: '1rem 0', color: 'var(--cds-text-secondary)' }}>
            All trip plans will appear here.
          </p>
        </TabPanel>
        <TabPanel>
          <p style={{ padding: '1rem 0', color: 'var(--cds-text-secondary)' }}>
            Recently viewed plans.
          </p>
        </TabPanel>
        <TabPanel>
          <p style={{ padding: '1rem 0', color: 'var(--cds-text-secondary)' }}>
            Plans shared with you.
          </p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

const meta: Meta<typeof TabsDemo> = {
  title: 'Primitives/Tabs',
  component: TabsDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carbon `Tabs` for switching between related views. Used on the Dashboard for filtering trip plans.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TabsDemo>;

export const Default: Story = {};
