# Carbon Design System – Quick Reference

Dokumentacja dla audytu UX/UI. Źródło: [Carbon Design System](https://carbondesignsystem.com/).

---

## Komponenty – kiedy którego używać

| Potrzeba | Komponent Carbon | Import | Uwagi |
| -------- | ----------------- | ------ | ----- |
| Przycisk | `Button` | `@carbon/react` | kind: primary \| secondary \| tertiary \| ghost \| danger. Z ikoną: renderIcon + iconDescription. |
| Pole tekstowe | `TextInput` | `@carbon/react` | Zawsze labelText; invalid + invalidText przy błędzie. |
| Wieloliniowy tekst | `TextArea` | `@carbon/react` | Jak TextInput – label, invalid, helperText. |
| Dropdown | `Select` + `SelectItem` | `@carbon/react` | labelText, value, onChange. |
| Modal | `Modal` | `@carbon/react` | modalHeading, primary/secondaryButtonText, onRequestSubmit, onRequestClose. |
| Powiadomienie w kontekście | `InlineNotification` | `@carbon/react` | kind: error \| warning \| info \| success; onClose. |
| Toast | `ToastNotification` | `@carbon/react` | timeout, onClose. |
| Ładowanie | `Loading` | `@carbon/react` | description (a11y); withOverlay, small. |
| Siatka | `Grid`, `Column` | `@carbon/react` | Layout strony (np. Login, Dashboard). |
| Formularz – grupa pól | `Form`, `FormGroup` | `@carbon/react` | legendText na FormGroup; Stack gap wewnątrz. |
| Menu kontekstowe | `OverflowMenu`, `OverflowMenuItem` | `@carbon/react` | renderIcon, iconDescription. |
| Karta klikalna / blok treści | `Tile`, `ClickableTile` | `@carbon/react` | Zamiast custom divów na karty (Dashboard, LocationCard, TransportCard). |
| Etykieta / tag | `Tag` | `@carbon/react` | Kategorie, statusy. |
| Link | `Link` | `@carbon/react` | href, inline. |
| Stos pionowy | `Stack` | `@carbon/react` | gap={3–7} = spacing scale. |
| Zakładki | `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel` | `@carbon/react` | Gdy wiele sekcji w jednym widoku. |
| Daty | `DatePicker`, `DatePickerInput` | `@carbon/react` | Formularze planów. |

---

## Tokeny koloru (SCSS / foundation)

Używać w SCSS (np. `carbon-overrides.scss`) lub przez theme – **nie** hardkodować hexów w komponentach.

| Token | Przeznaczenie |
| ----- | -------------- |
| `$layer-01` | Główny tło |
| `$layer-02` | Tło kart / drugi poziom |
| `$layer-accent-01` | Tło akcentu |
| `$text-primary` | Główny tekst |
| `$text-secondary` | Tekst drugoplanowy |
| `$text-placeholder` | Placeholder |
| `$border-subtle` | Delikatna krawędź |
| `$border-strong` | Wyraźna krawędź |
| `$interactive-01` | Primary CTA |
| `$interactive-02` | Secondary CTA |
| `$danger` | Akcje destrukcyjne |

W React (inline) – tylko w wyjątkach; preferować klasy SCSS z tokenami.

---

## Tokeny spacingu

| Token | Wartość | Użycie |
| ----- | ------- | ------ |
| `$spacing-02` | 0.25rem (4px) | Minimalny odstęp |
| `$spacing-03` | 0.5rem (8px) | Ciasny |
| `$spacing-04` | 0.75rem (12px) | Domyślny inline |
| `$spacing-05` | 1rem (16px) | Standardowy |
| `$spacing-06` | 1.5rem (24px) | Sekcje |
| `$spacing-07` | 2rem (32px) | Duży |
| `$spacing-09` | 3rem (48px) | Bardzo duży |

W React: `<Stack gap={5}>` = 1rem; gap={6} = 1.5rem itd.

---

## Ikony

- Biblioteka: `@carbon/icons-react`.
- Przy przyciskach tylko ikona: `hasIconOnly` + `iconDescription` (wymagane dla a11y).
- Spójna konwencja: np. 16px w listach, 20px w przyciskach; kolor z tokenów (`$icon-primary` / `$text-secondary`).

---

## Dostępność (a11y)

- Wszystkie pola formularza: `labelText` lub aria-label.
- Przyciski z samą ikoną: `iconDescription`.
- Loading: `description` w `<Loading>`.
- Focus: nie wyłączać outline; używać focus-within / focus-visible zgodnie z Carbon.
- Kontrast: kolory z palety Carbon (theme domyślnie spełnia WCAG).

---

## Pliki projektu

- Zasady rozszerzone: `.cursorrules` w repo.
- Style nadpisujące Carbon / Leaflet: `src/styles/carbon-overrides.scss` – muszą być zaimportowane w `main.tsx`, żeby działały.
- Theme: `src/styles/carbon-theme.scss` – opcjonalne nadpisania theme.
