import type { Meta, StoryObj } from '@storybook/react-vite';
import SearchResults from './SearchResults';
import type { GeocodingResult } from '../../services/geocoding';

const mockResults: GeocodingResult[] = [
  {
    place_id: 1,
    display_name: 'Wawel Royal Castle, Wawel 5, Kraków, Poland',
    lat: '50.0540',
    lon: '19.9354',
    type: 'attraction',
    category: 'tourism',
    address: { road: 'Wawel', house_number: '5', city: 'Kraków', country: 'Poland' },
    extratags: { opening_hours: 'Mo-Su 09:00-17:00', website: 'https://wawel.krakow.pl', wikidata: 'Q184350' },
    namedetails: { name: 'Wawel Royal Castle' },
  },
  {
    place_id: 2,
    display_name: 'Sukiennice, Main Market Square, Kraków, Poland',
    lat: '50.0617',
    lon: '19.9372',
    type: 'museum',
    category: 'tourism',
    address: { road: 'Main Market Square', city: 'Kraków', country: 'Poland' },
    extratags: { opening_hours: 'Tu-Su 10:00-18:00' },
    namedetails: { name: 'Sukiennice' },
  },
  {
    place_id: 3,
    display_name: 'Pod Baranem, Rynek Główny 27, Kraków, Poland',
    lat: '50.0615',
    lon: '19.9380',
    type: 'restaurant',
    category: 'restaurant',
    address: { road: 'Rynek Główny', house_number: '27', city: 'Kraków', country: 'Poland' },
    extratags: { cuisine: 'polish;european', phone: '+48 12 421 17 68', opening_hours: '12:00-23:00' },
    namedetails: { name: 'Pod Baranem' },
  },
];

const meta: Meta<typeof SearchResults> = {
  title: 'Components/Search/SearchResults',
  component: SearchResults,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Search results dropdown displayed below the header search input. Supports keyboard navigation (arrow keys, Enter, Escape).',
          '',
          '**Status**: Stable',
          '',
          '**Carbon dependency**: `Loading`, `Button`',
          '',
          '**Features**: keyboard nav, category icons, opening hours, cuisine tags, phone, website indicator, "Add to plan" action',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    isLoading: { control: 'boolean', table: { category: 'States' } },
    canAddToPlan: { control: 'boolean', table: { category: 'States' } },
    onSelect: { action: 'select', table: { category: 'Events' } },
    onAddToPlan: { action: 'addToPlan', table: { category: 'Events' } },
    onHover: { action: 'hover', table: { category: 'Events' } },
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', maxWidth: 500, minHeight: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchResults>;

export const Default: Story = {
  args: {
    results: mockResults,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    results: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  name: 'Empty (no results)',
  args: {
    results: [],
    isLoading: false,
  },
};

export const WithAddToPlan: Story = {
  name: 'With "Add to Plan" Button',
  args: {
    results: mockResults,
    isLoading: false,
    canAddToPlan: true,
  },
};

export const WithEnriched: Story = {
  name: 'With Wikipedia Description',
  args: {
    results: mockResults,
    isLoading: false,
    enrichedByPlaceId: {
      1: { description: 'A fortified architectural complex erected over many centuries atop a limestone outcrop on the left bank of the Vistula river in Kraków, Poland.' },
    },
  },
};
