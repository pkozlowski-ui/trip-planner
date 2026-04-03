---
name: carbon-ux-audit
description: Przeprowadza audyt UX/UI pod kątem zgodności z IBM Carbon Design System i spójności między ekranami. Używać przy prośbach o audyt Carbon, design system compliance, redesign pod Carbon.
---

# Carbon UX/UI Audit Skill

## Kiedy używać

- Użytkownik prosi o **audyt UX**, **audyt Carbon**, **zgodność z Carbon Design System**, **design system review**, **redesign pod Carbon**.
- Trzeba zweryfikować ekrany aplikacji pod kątem komponentów Carbon, tokenów, spójności i prezentacji treści (zdjęcia, OSM/Wikipedia).

## Instrukcje krok po kroku

1. **Użyj Carbon reference** z pliku `reference.md` w tym skillu (komponenty, tokeny koloru i spacingu, kiedy którego komponentu używać).

2. **Dla każdego ekranu** zastosuj szablon audytu:

   | Aspekt     | Pytanie                                                         | Status         |
   | ---------- | --------------------------------------------------------------- | -------------- |
   | Komponenty | Czy używane są komponenty Carbon zamiast custom?                | T / N / częściowo |
   | Tokeny     | Czy kolory i spacing z tokenów Carbon (bez hexów)?              | T / N          |
   | Układ      | Czy hierarchia i grupowanie treści spójne z innymi ekranami?    | T / N          |
   | Ikony      | Czy ikony z @carbon/icons-react, jedna konwencja (rozmiar, kolor)? | T / N       |
   | Stany      | Loading / error / empty z Carbon (Loading, InlineNotification)? | T / N          |
   | Treści     | Zdjęcia/OSM/Wikipedia – czy dobrze widoczne i spójne?          | T / N          |

3. **Wypisz konkretne pliki i propozycje zmian** (np. „LocationCard.tsx → Carbon Tile + tokeny SCSS”, „usunąć inline style z hexami”).

4. **Sprawdź prezentację zdjęć i atrybucji**: plan (Sidebar), wyszukiwanie (SearchResults), popupy na mapie (LocationMarker). Czy `location.image` i atrybucja są wszędzie, gdzie potrzeba?

5. **Zwróć raport** w formacie Markdown:
   - Tabela ekranów z wypełnionym szablonem.
   - Lista niespójności z plikami i priorytetami (P0 / P1 / P2).
   - Rekomendacje: co zmienić w pierwszej kolejności (np. podłączenie SCSS, zamiana kart na Tile, zdjęcie w popupie).

## Checklist (weryfikacja globalna)

- [ ] Kolory tylko z tokenów Carbon (SCSS lub CSS variables) – zero hexów w komponentach.
- [ ] Przyciski, inputy, modale, formularze z `@carbon/react`.
- [ ] Spacing ze skali Carbon (Stack gap, tokeny $spacing-*).
- [ ] Każdy ekran ma obsłużone: loading, error, empty (Carbon Loading, InlineNotification, empty state z CTA).
- [ ] Ikony z `@carbon/icons-react`; iconDescription przy hasIconOnly.
- [ ] Karty/listy: preferować Carbon Tile / ClickableTile zamiast custom divów.

## Ekrany do audytu (Trip Planner)

- **Login** – `src/pages/Login.tsx`
- **Dashboard** – `src/pages/Dashboard.tsx` (karty planów)
- **Plan Editor**: Header (`src/components/layout/Header.tsx`), Sidebar (`Sidebar.tsx`, `DaySection.tsx`, `LocationCard.tsx`, `TransportCard.tsx`), Map + popupy (`LocationMarker.tsx`), Modale (LocationFormModal, TripPlanFormModal, TransportFormModal), ChatPanel (`ChatPanel.tsx`)
- **Search** – `src/components/search/SearchResults.tsx`

## Priorytety w raporcie

- **P0**: Blokuje spójność (np. brak tokenów, custom komponenty zamiast Carbon).
- **P1**: Ważne dla UX (np. brak zdjęcia w popupie, niespójne układy).
- **P2**: Kosmetyka (dopracowanie empty states, ikony).

## Atomic design (przy konsolidacji)

- **Atomy**: Button, TextInput, Tag, Skeleton (Carbon).
- **Molekuły**: LocationCard, TransportCard, SearchResultRow – powinny używać Carbon (Tile, Tag) i tokenów.
- **Organizmy**: DaySection, MapView, Header – spójna kompozycja molekuł i atomów.

## Źródła

- Carbon Design System: https://carbondesignsystem.com/
- Projekt: `.cursorrules` w repo – rozszerzone zasady Carbon dla Trip Planner.
- Szczegóły komponentów i tokenów: plik `reference.md` w tym skillu.
