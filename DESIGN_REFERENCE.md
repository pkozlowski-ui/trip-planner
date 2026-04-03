# Design Reference - Trip Planner Layout

## Przegląd Layoutu

Aplikacja składa się z trzech głównych sekcji:

1. **Top Header/Navigation Bar** - poziomy pasek na górze z kontrolkami globalnymi
2. **Left Sidebar** - pionowy panel po lewej stronie z planem podróży
3. **Main Map Area** - główna sekcja po prawej stronie z interaktywną mapą

---

## 1. Top Header / Navigation Bar

### Struktura (od lewej do prawej):

#### Lewa strona:
- **Back arrow icon** (`<`) - powrót do poprzedniej strony
- **Trip Title** - "Wypad do Zakopanego" (nazwa planu podróży)
- **Trip Summary** - "2 dni • 6 punktów • 795 km"
  - Liczba dni
  - Liczba punktów
  - Całkowita odległość

#### Środek:
- **Search Bar** - "Szukaj punktu podróży"
  - Ikona lupy
  - Placeholder tekst
- **Advanced Link** - "Zaawansowane" (link tekstowy)

#### Prawa strona:
- **Filter Buttons** (seria przycisków z ikonami):
  - "Popularne" (Popular)
  - "Noclegi" (Accommodation)
  - "Kulinaria" (Cuisine)
  - "Rozrywka" (Entertainment)
  - "Outdoor"
  - "Kultura" (Culture)
  - "Wypożyczalnie" (Rentals)
  - "Sklepy" (Shops)
  - Każdy przycisk ma dropdown arrow (więcej opcji)

- **User Avatars** - 2 małe okrągłe awatary użytkowników
- **Save Button** - niebieski przycisk "Zapisz"
- **More Options** - ikona trzech kropek (vertical ellipsis)

---

## 2. Left Sidebar - Plan Podróży

### Header Sidebar:
- **Title**: "Plan podróż" (Trip Plan)
- **Filter/Sort Icon** - ikona obok tytułu

### Struktura zawartości:

#### Organizacja według dni:

**DZIEŃ 1:**
- **Gdynia Card**
  - Obrazek: budynki miasta
  - Label: "Miasto, Pomorskie"
  - Travel indicator: ikona samochodu
  - Travel info: "222 km • 2h 49m"

- **Jura Park Solec Card**
  - Obrazek: park dinozaurów
  - Label: "Park rozrywki, Solec Ku.."
  - Clock icon: "3h • 7:00-21:00"
  - Travel indicator: ikona samochodu
  - Travel info: "565 km • 6h 23m"

- **Zakopane Card**
  - Obrazek: góry
  - Label: "Miasto, Małopolskie"

**DZIEŃ 2:**
- **Kiry Card**
  - Obrazek: drewniana brama
  - Label: "TPN Wejście"
  - Travel indicator: ikona pieszego
  - Travel info: "2,9 km • 46m"

- **Jaskinia Mroźna Card**
  - Obrazek: wejście do jaskini
  - Label: "Jaskinia, TPN"
  - Clock icon: "1h • 7:00-21:00"
  - Travel indicator: ikona pieszego
  - Travel info: "5,1 km • 1h 12m"

- **Smreczyński Staw Card**
  - Obrazek: górskie jezioro
  - Label: "Punkt widokowy, TPN"

#### Bottom Action:
- **"Dodaj kolejny dzień"** button - przycisk na dole sidebaru

### Wzorce kart lokalizacji:
- Obrazek lokalizacji (thumbnail)
- Nazwa i kategoria lokalizacji
- Informacje o czasie trwania (jeśli dostępne)
- Wskaźnik podróży (samochód/pieszo) z odległością i czasem
- Kolejność wizyt (implicite przez pozycję w liście)

---

## 3. Main Map Area

### Elementy mapy:

#### Warstwa mapy:
- **Minimalistyczny styl mapy** - zgodny z designem referencyjnym:
  - Light gray background dla lądu (jasnoszare tło)
  - Dark blue dla wody (ciemnoniebieski)
  - Subtelne cieniowanie wskazujące zmiany wysokości
  - Cienkie szare linie dla dróg
  - Minimalne detale i kolory
  - Etykiety miejscowości (opcjonalnie, można wyłączyć)
- Mapa geograficzna z minimalistycznym renderingiem
- Używa CartoDB Positron lub podobnego minimalistycznego tile layer

#### Route Line:
- **Niebieska linia** - śledzi zaplanowaną trasę przez Polskę
- Rozpoczyna się na północy (okolice Gdyni)
- Kieruje się na południe w stronę Zakopanego

#### Markery na mapie:
- Różne ikony reprezentujące typy punktów:
  - Ikona budynku
  - Ikona koszyka zakupów
  - Ikona gwiazdy
  - Ikona góry
- Niektóre markery są ponumerowane (np. niebieski okrągły marker z "4")
- Markery wskazują kolejne przystanki na trasie

#### Popup/Modal na mapie:
- **Ojcowski Park Narodowy** (przykład otwartego popup)
  - Mały obrazek parku
  - Nazwa: "Ojcowski Park Narodowy"
  - Opis: "Park narodowy, Małopolskie"
  - Rating: "4.9/5" (gwiazdki)
  - Clock icon: "8h" (czas trwania)
  - Blue plus icon (+) - przycisk dodania do planu

#### Map Controls:
- **Zoom Controls** (prawy dolny róg):
  - Przycisk plus (+) - zoom in
  - Przycisk minus (-) - zoom out

---

## Komponenty do zaimplementowania

### 1. Header Components:
- `TripHeader` - header z tytułem i podsumowaniem
- `SearchBar` - pasek wyszukiwania
- `FilterButtons` - seria przycisków filtrów
- `UserMenu` - menu użytkownika z awatarami
- `SaveButton` - przycisk zapisu

### 2. Sidebar Components:
- `TripPlanSidebar` - główny kontener sidebaru
- `DaySection` - sekcja dla jednego dnia
- `LocationCard` - karta lokalizacji z:
  - Thumbnail image
  - Nazwa i kategoria
  - Czas trwania (opcjonalnie)
  - Travel indicator (car/walking icon)
  - Travel info (distance + time)
- `AddDayButton` - przycisk dodania dnia

### 3. Map Components:
- `MapView` - główny komponent mapy (już istnieje)
- `RouteLine` - linia trasy na mapie
- `LocationMarker` - marker lokalizacji z:
  - Custom icon według typu
  - Numer kolejności (opcjonalnie)
  - Popup z informacjami
- `LocationPopup` - popup z:
  - Obrazek
  - Nazwa i opis
  - Rating
  - Czas trwania
  - Przycisk dodania do planu

### 4. Layout Components:
- `AppLayout` - główny layout z trzema sekcjami
- `HeaderBar` - górny pasek nawigacji
- `Sidebar` - lewy panel
- `MapContainer` - kontener mapy

---

## Struktura danych (na podstawie designu)

### TripPlan:
```typescript
{
  id: string;
  title: string;
  days: number;
  totalPoints: number;
  totalDistance: number; // km
  days: Day[];
}
```

### Day:
```typescript
{
  dayNumber: number;
  date?: Date;
  locations: Location[];
}
```

### Location:
```typescript
{
  id: string;
  name: string;
  category: string; // "Miasto", "Park rozrywki", "Jaskinia", etc.
  coordinates: { lat: number; lng: number };
  image?: string;
  duration?: string; // "3h"
  openingHours?: string; // "7:00-21:00"
  rating?: number; // 4.9
  travelToNext?: {
    type: 'car' | 'walking';
    distance: number; // km
    time: string; // "2h 49m"
  };
  order: number;
}
```

---

## Kolory i style (z designu)

- **Background**: Białe tło aplikacji, subtelne szare tło dla całego interfejsu
- **Primary Blue**: Niebieski kolor dla przycisków akcji (Save, Add)
- **Route Line**: Niebieska linia na mapie
- **Cards**: Karty z obrazkami, białe tło, zaokrąglone rogi
- **Icons**: Ikony dla różnych typów lokalizacji i akcji

---

## Interakcje (z designu)

1. **Kliknięcie na marker** - otwiera popup z informacjami
2. **Kliknięcie "+" w popup** - dodaje lokalizację do planu
3. **Filtry** - filtrują dostępne lokalizacje na mapie
4. **Search** - wyszukuje punkty podróży
5. **Drag & Drop** w sidebarze - zmiana kolejności lokalizacji (implicite)
6. **Zoom controls** - zoomowanie mapy
7. **Pan mapy** - przesuwanie mapy

---

## Responsywność

Design pokazuje desktop layout. Dla mobile należy rozważyć:
- Sidebar jako overlay/drawer
- Header jako collapsible
- Map jako fullscreen z możliwością przełączenia na listę

---

## Notatki implementacyjne

1. **Carbon Design System** - używać komponentów Carbon dla:
   - Buttons (Save, Add)
   - Search input
   - Cards (można użyć Carbon Card lub własny)
   - Icons (Carbon icons)

2. **Leaflet** - dla mapy:
   - Custom markers z ikonami
   - Polyline dla route
   - Popup z custom content

3. **Layout Grid**:
   - Header: full width
   - Sidebar: ~300-400px width, fixed height
   - Map: flex-grow, full height

4. **State Management**:
   - Selected day
   - Selected location
   - Map center/zoom
   - Filter state

---

## Pliki do utworzenia (na podstawie designu)

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── HeaderBar.tsx
│   │   └── Sidebar.tsx
│   ├── trip/
│   │   ├── TripHeader.tsx
│   │   ├── DaySection.tsx
│   │   ├── LocationCard.tsx
│   │   └── AddDayButton.tsx
│   ├── map/
│   │   ├── MapView.tsx (już istnieje)
│   │   ├── RouteLine.tsx
│   │   ├── LocationMarker.tsx
│   │   └── LocationPopup.tsx
│   └── common/
│       ├── SearchBar.tsx
│       ├── FilterButtons.tsx
│       └── SaveButton.tsx
```

---

Ten dokument służy jako referencja podczas implementacji layoutu aplikacji.

