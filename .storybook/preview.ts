import type { Preview } from '@storybook/react-vite';

import '@carbon/styles/css/styles.css';
import '../src/styles/carbon-overrides.scss';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
    options: {
      storySort: {
        order: [
          'Design System',
          ['Introduction'],
          'Foundations',
          ['Colors', 'Typography', 'Spacing', 'Icons', 'Motion'],
          'Primitives',
          'Components',
          'Patterns',
        ],
      },
    },
  },
};

export default preview;
