import type { Location, Transport, TripPlan, Day, MediaItem } from '../types';

export const mockLocation: Location = {
  id: 'loc-1',
  name: 'Wawel Royal Castle',
  category: 'attraction',
  coordinates: { lat: 50.0540, lng: 19.9354 },
  description: 'Historic royal residence and UNESCO World Heritage Site in Kraków.',
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/640px-Wawel_castle.jpg',
  imageAttribution: { author: 'Jan Mehlich', license: 'CC BY-SA 3.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Wawel_castle.jpg' },
  website: 'https://wawel.krakow.pl',
  openingHours: '9:00-17:00',
  rating: 4.8,
  order: 0,
  media: [],
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};

export const mockLocationWithMedia: Location = {
  ...mockLocation,
  id: 'loc-2',
  name: 'Main Market Square',
  category: 'city',
  coordinates: { lat: 50.0617, lng: 19.9372 },
  description: 'The largest medieval town square in Europe.',
  media: [
    { id: 'm1', type: 'image', url: 'https://example.com/img1.jpg', createdAt: new Date() },
    { id: 'm2', type: 'image', url: 'https://example.com/img2.jpg', createdAt: new Date() },
    { id: 'm3', type: 'youtube', url: 'https://youtube.com/watch?v=abc', title: 'Walking tour', createdAt: new Date() },
    { id: 'm4', type: 'link', url: 'https://en.wikipedia.org/wiki/Main_Square,_Kraków', title: 'Wikipedia', createdAt: new Date() },
  ] as MediaItem[],
};

export const mockLocationNoImage: Location = {
  ...mockLocation,
  id: 'loc-3',
  name: 'Kazimierz District',
  category: 'city',
  image: undefined,
  rating: undefined,
  openingHours: undefined,
};

export const mockLocationRestaurant: Location = {
  ...mockLocation,
  id: 'loc-4',
  name: 'Pod Wawelem',
  category: 'restaurant',
  image: undefined,
  rating: 4.2,
  openingHours: '12:00-23:00',
};

export const mockTransportCar: Transport = {
  id: 'tr-1',
  fromLocationId: 'loc-1',
  toLocationId: 'loc-2',
  type: 'car',
  distance: 12.5,
  time: '25 min',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};

export const mockTransportWalking: Transport = {
  id: 'tr-2',
  fromLocationId: 'loc-2',
  toLocationId: 'loc-3',
  type: 'walking',
  distance: 1.2,
  time: '15 min',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};

export const mockTransportPublic: Transport = {
  id: 'tr-3',
  fromLocationId: 'loc-3',
  toLocationId: 'loc-4',
  type: 'public-transport',
  distance: 8.0,
  time: '35 min',
  notes: 'Take tram #3 from Plac Bohaterów',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};

export const mockDay: Day = {
  id: 'day-1',
  dayNumber: 1,
  date: new Date('2025-07-10'),
  locations: [mockLocation, mockLocationWithMedia, mockLocationNoImage],
  transports: [mockTransportCar, mockTransportWalking],
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};

export const mockTripPlan: TripPlan = {
  id: 'plan-1',
  userId: 'user-1',
  title: 'Kraków Weekend',
  description: 'A 3-day trip exploring the best of Kraków',
  startDate: new Date('2025-07-10'),
  endDate: new Date('2025-07-12'),
  days: [mockDay],
  totalDays: 3,
  totalPoints: 6,
  totalDistance: 24.5,
  isPublic: false,
  coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Wawel_castle.jpg/640px-Wawel_castle.jpg',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};
