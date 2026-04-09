import type { Meta, StoryObj } from '@storybook/react-vite';
import ContextMenu from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Components/Map/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Right-click context menu on the map. Shows reverse-geocoded location info and "Add Marker" action.',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Button`, `Loading`',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    x: { control: 'number', table: { category: 'Data' } },
    y: { control: 'number', table: { category: 'Data' } },
    isLoadingLocationInfo: { control: 'boolean', table: { category: 'States' } },
    onAddMarker: { action: 'addMarker', table: { category: 'Events' } },
    onClose: { action: 'close', table: { category: 'Events' } },
  },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Loading: Story = {
  args: {
    x: 100,
    y: 100,
    isLoadingLocationInfo: true,
    locationInfo: null,
  },
};

export const WithLocationInfo: Story = {
  args: {
    x: 100,
    y: 100,
    isLoadingLocationInfo: false,
    locationInfo: {
      place_id: 123,
      lat: '50.0540',
      lon: '19.9354',
      display_name: 'Wawel 5, Kraków, Lesser Poland, Poland',
      type: 'attraction',
      category: 'tourism',
      address: {
        road: 'Wawel',
        house_number: '5',
        city: 'Kraków',
        country: 'Poland',
      },
    } as any,
  },
};

export const WithEnriched: Story = {
  name: 'With Wikipedia Enrichment',
  args: {
    x: 100,
    y: 100,
    isLoadingLocationInfo: false,
    locationInfo: {
      place_id: 123,
      lat: '50.0540',
      lon: '19.9354',
      display_name: 'Wawel 5, Kraków, Lesser Poland, Poland',
      type: 'attraction',
      category: 'tourism',
      address: { road: 'Wawel' },
      extratags: { wikidata: 'Q184350' },
    } as any,
    enriched: {
      description: 'Fortified architectural complex on the Vistula River in Kraków, Poland.',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Wawel_Castle',
      website: 'https://wawel.krakow.pl',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/320px-Wawel_castle.jpg',
    },
  },
};
