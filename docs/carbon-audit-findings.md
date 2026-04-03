# Carbon UX/UI Audit – Findings

Raport z audytu ekran po ekranie pod kątem zgodności z IBM Carbon Design System i spójności między ekranami. Trip Planner.

---

## 1. Tabela audytu (szablon wypełniony)

| Ekran / obszar | Komponenty | Tokeny | Układ | Ikony | Stany | Treści |
|----------------|------------|--------|-------|-------|-------|--------|
| **Login** | T (Carbon) | częściowo | T | T | T | N/A |
| **Dashboard** | N (custom karty) | N | T | T | T | N/A |
| **Header** | T (Carbon) | częściowo | T | T | T | N/A |
| **Sidebar – LocationCard** | częściowo (OverflowMenu Carbon) | N | T | T | – | T (zdjęcie + atrybucja) |
| **Sidebar – TransportCard** | częściowo (OverflowMenu Carbon) | N | T | T | – | N/A |
| **Sidebar – DaySection** | częściowo (Button Carbon) | N | T | T | – | N/A |
| **Map popup (LocationMarker)** | N (custom HTML) | N | T | T | – | N (brak location.image) |
| **SearchResults** | częściowo (Loading, Button) | N | T | T | T | częściowo (brak thumbnail) |
| **Modale** (Location, TripPlan, Transport) | T (Carbon) | częściowo | T | T | T | T |
| **ChatPanel** | T (Carbon) | częściowo | T | T | – | N/A |
| **ContextMenu (mapa)** | częściowo (Button Carbon) | N | T | T | – | N/A |

Legenda: **T** = tak / zgodne, **N** = nie / do poprawy, **częściowo** = mieszanka Carbon i custom.

---

## 2. Lista niespójności z priorytetami

### P0 – blokuje spójność z Carbon

| # | Plik | Problem | Rekomendacja |
|---|------|---------|--------------|
| 1 | `src/main.tsx` | Plik `carbon-overrides.scss` nie jest importowany | Dodać `import './styles/carbon-overrides.scss'` w `main.tsx`, żeby style popupów i tokeny działały. |
| 2 | `src/components/layout/LocationCard.tsx` | Karta to custom `<div>` z inline styles, hexy (#e8f4ff, #0f62fe, #e0e0e0, #ffffff, #666) | Przejść na Carbon Tile (lub ClickableTile) z klasami SCSS używającymi tokenów ($layer-02, $border-subtle, $interactive-01). Zdjęcie zachować w obszarze media. |
| 3 | `src/components/transport/TransportCard.tsx` | Custom `<div>` z hexami (#ffffff, #d0d0d0, #161616, #666) | Użyć Carbon Tile (compact) lub ListItem + tokeny SCSS. |
| 4 | `src/pages/Dashboard.tsx` | TripPlanCard i CreateTripCard – custom divy, gradienty i kolory poza tokenami (#f4f4f4, #c6c6c6, #525252, #161616, #0f62fe) | Użyć Carbon ClickableTile; gradient/akcent opcjonalnie przez token layer-accent lub osobny modifier. |

### P1 – ważne dla UX

| # | Plik | Problem | Rekomendacja |
|---|------|---------|--------------|
| 5 | `src/components/map/LocationMarker.tsx` | W popupie brak głównego zdjęcia lokacji (`location.image`); jest tylko miniaturka YouTube | Dodać na górze popupa blok ze zdjęciem (np. 100–120px wysokości), fallback gdy brak; zachować YouTube poniżej. |
| 6 | `src/components/search/SearchResults.tsx` | Wiersze wyników to custom `<div>` z hexami (#ffffff, #e0e0e0, #e8e8e8, #f4f4f4, #0f62fe, #525252, #161616); brak thumbnaila zdjęcia z Wikimedia | Ujednolicić z Carbon: ListItem / ClickableTile; kolory przez SCSS/tokeny. Opcjonalnie dodać thumbnail (enriched?.image) w stałym aspect ratio. |
| 7 | `src/components/map/ContextMenu.tsx` | Kontekstowe menu to custom pozycjonowany div; tylko przyciski Carbon | Zostawić Leaflet context lub zastąpić Carbon Popover; style (tło, obramowanie) przez tokeny w SCSS. |
| 8 | Wszystkie powyższe | Inline style z hexami w wielu komponentach | Stopniowo przenosić do SCSS z tokenami ($text-primary, $text-secondary, $border-subtle, $layer-01, $layer-02). |

### P2 – kosmetyka / dopracowanie

| # | Plik | Problem | Rekomendacja |
|---|------|---------|--------------|
| 9 | `src/styles/carbon-overrides.scss` | W pliku nadal są hexy (#e0e0e0, #ffffff, #525252, #161616, #e8e8e8) | Zamienić na tokeny Carbon ($border-subtle, $layer-01, $text-primary, $text-secondary itd.). |
| 10 | Empty states | Nie wszystkie listy (np. puste dni, brak wyników wyszukiwania) mają spójny empty state z CTA | Dodać jeden wzorzec empty state (Carbon + krótki tekst + opcjonalny Button). |
| 11 | Potwierdzenia usuwania | `window.confirm()` w LocationCard i TransportCard | Zastąpić Carbon Modal (danger, primaryButtonText "Delete") dla spójności. |
| 12 | Ikony | Bike w TransportCard używa CircleFilled (fallback) | Sprawdzić czy Carbon ma ikonę roweru lub wybrać inną oficjalną ikonę. |

---

## 3. Prezentacja treści (zdjęcia, OSM, Wikipedia)

| Miejsce | Stan | Rekomendacja |
|---------|------|--------------|
| **Sidebar – LocationCard** | Zdjęcie (location.image) i atrybucja są | Zachować po redesignie na Tile; ten sam blok treści. |
| **Wyszukiwanie – SearchResults** | Tylko ikona kategorii, brak zdjęcia z enrichment | Opcjonalnie dodać thumbnail (enriched?.image) w stałym ratio; przy większej liczbie wyników rozważyć lazy load. |
| **Map popup – LocationMarker** | Brak location.image; tylko YouTube thumbnail | **Dodać** location.image na górze popupa (wys. 100–120px), atrybucja pod zdjęciem; jedna konwencja z LocationCard. |
| **Atrybucja** | imageAttribution w LocationCard | Użyć tej samej konwencji (autor, licencja, link) w popupie po dodaniu zdjęcia. |

---

## 4. Atomic design – podsumowanie

- **Atomy**: Button, TextInput, Modal, Loading, InlineNotification, OverflowMenu – Carbon, OK. Dodać: Tag, Skeleton gdzie potrzebne.
- **Molekuły**: LocationCard, TransportCard, wiersz SearchResults, TripPlanCard, CreateTripCard – obecnie custom; docelowo oparte o Carbon Tile / ClickableTile + SCSS.
- **Organizmy**: DaySection (lista LocationCard + TransportCard), Header (search + OverflowMenu), MapView (markery + popupy) – po ujednoliceniu molekuł będą spójne.

---

## 5. Kolejność realizacji (rekomendowana)

1. **Podłączyć SCSS** – import `carbon-overrides.scss` w `main.tsx` (oraz ewent. `carbon-theme.scss`).
2. **Zamiana kart** – Dashboard (TripPlanCard, CreateTripCard) i Sidebar (LocationCard, TransportCard) na Carbon Tile + tokeny w SCSS.
3. **Map popup** – dodać `location.image` w LocationMarker; spójny layout z atrybucją.
4. **SearchResults** – layout oparty o Carbon (ListItem/ClickableTile), kolory ze SCSS/tokenów; opcjonalnie thumbnail.
5. **Usunięcie hexów** – w carbon-overrides.scss i w pozostałych komponentach (inline → klasy SCSS z tokenami).
6. **Empty states i potwierdzenia** – jeden wzorzec empty state; zamiana window.confirm na Modal przy usuwaniu.

---

## 6. Post-implementation (po realizacji planu)

### Zrealizowane

- **P0 #1**: SCSS podłączone w `main.tsx` (import `carbon-overrides.scss`).
- **P0 #2–4**: LocationCard i TransportCard używają Carbon Tile; Dashboard używa ClickableTile (TripPlanCard, CreateTripCard). Style w SCSS z tokenami (var(--cds-*)).
- **P1 #5**: W LocationMarker popup jest `location.image` i atrybucja; kolory przez tokeny.
- **P1 #6**: SearchResults ma klasy `.search-results`, `.search-results__row` itd. w SCSS z tokenami; brak thumbnaila zachowany (opcjonalnie do dodania później).
- **P1 #8**: Zmniejszona liczba hexów – karty, SearchResults, popup używają tokenów / klas SCSS.

### Atomic design – stan po zmianach

| Poziom   | Przykłady | Uwagi |
|----------|-----------|--------|
| **Atomy** | Button, TextInput, Modal, Loading, InlineNotification, OverflowMenu, Tile, ClickableTile (Carbon) | Spójne; Tag, Skeleton można dodać przy kolejnych iteracjach. |
| **Molekuły** | LocationCard (Tile + image + body + OverflowMenu), TransportCard (Tile + ikona + meta + OverflowMenu), wiersz SearchResults (div z klasami SCSS), TripPlanCard / CreateTripCard (ClickableTile + treść) | Wszystkie oparte o Carbon Tile/ClickableTile i tokeny. |
| **Organizmy** | DaySection (lista LocationCard + TransportCard), Header (search + OverflowMenu), MapView (markery + popupy), Sidebar | Kompozycja molekuł ujednolicona. |

### Zbędne elementy / dalsze uproszczenia

- **ContextMenu (mapa)**: Nadal custom wrapper; można w przyszłości zastąpić Carbon Popover lub zostawić z klasą SCSS z tokenami.
- **Potwierdzenia usunięcia**: `window.confirm` w LocationCard i TransportCard – do zastąpienia Carbon Modal (P2).
- **Empty states**: Nie wszystkie listy mają jeden wspólny wzorzec empty state; warto dodać jeden komponent EmptyState z CTA (P2).
- **Ikona roweru**: TransportCard używa CircleFilled zamiast dedykowanej ikony – sprawdzić Carbon icons (P2).

---

*Audyt wykonany według procesu z skillu `.cursor/skills/carbon-ux-audit/`. Źródło: Carbon Design System (carbondesignsystem.com), .cursorrules projektu.*
