# Map Components

## MapView

Główny komponent mapy używający Leaflet z minimalistycznym stylem zgodnym z designem referencyjnym.

### Właściwości

- `center?: [number, number]` - współrzędne centrum mapy [lat, lng]
- `zoom?: number` - poziom zoomu (domyślnie 13)
- `height?: string` - wysokość mapy (domyślnie '400px')
- `mapStyle?: 'minimal' | 'minimal-no-labels' | 'toner-lite'` - styl mapy

### Style mapy

1. **`minimal`** (domyślny) - CartoDB Positron
   - Minimalistyczny, jasny styl
   - Light gray land, dark blue water
   - Z etykietami miejscowości
   - Najlepiej pasuje do designu referencyjnego

2. **`minimal-no-labels`** - CartoDB Positron No Labels
   - Jeszcze bardziej minimalistyczny
   - Bez etykiet miejscowości
   - Idealny gdy chcemy pokazać tylko route i markery

3. **`toner-lite`** - Stamen Toner Lite
   - Minimalistyczny czarno-biały styl
   - Bardzo subtelny, monochromatyczny

### Przykład użycia

```tsx
import MapView from './components/map/MapView';

<MapView 
  center={[52.2297, 21.0122]} 
  zoom={13} 
  height="500px"
  mapStyle="minimal"
/>
```

### Zgodność z designem

Mapa używa minimalistycznego stylu zgodnego z designem referencyjnym:
- Light gray background dla lądu
- Dark blue dla wody
- Subtelne cieniowanie wskazujące zmiany wysokości
- Minimalne detale i kolory
- Cienkie szare linie dla dróg

### Uwagi techniczne

- Używa CartoDB Positron jako domyślnego tile layer
- Wszystkie style są darmowe i nie wymagają API key
- Markery używają domyślnych ikon Leaflet (można je później zastąpić custom ikonami)

