# Analiza Carbon Design System - Figma

## Przegląd

Carbon Design System w Figma zawiera kompleksowy zestaw komponentów, tokenów designu i wzorców zgodnych z IBM Design Language. System jest zorganizowany w jeden plik z wszystkimi motywami (White, Gray 10, Gray 90, Gray 100) wykorzystującymi Figma Variables.

## Struktura Design Systemu

### 1. Komponenty Button

**Lokalizacja:** Strona "Button" (node-id: 10941:406859)

**Warianty:**
- **Style:** Primary, Secondary, Tertiary, Ghost, Danger primary, Danger tertiary, Danger ghost
- **Type:** Text + Icon, Icon only
- **Size:** Extra small (24px), Small (32px), Medium (40px), Large (48px), Extra large (64px), 2X large (80px), Expressive (48px)
- **State:** Enabled, Hover, Active, Focus, Disabled, Skeleton

**Kluczowe właściwości:**
- Wszystkie warianty mają zdefiniowane stany interakcji
- Ikony są opcjonalne i mogą być podmieniane
- Komponenty używają tokenów design systemu dla kolorów i typografii

**Implementacja:**
- Używać `@carbon/react` Button component jako podstawy
- Dostosować style według specyfikacji z Figma dla wariantów niestandardowych
- Implementować wszystkie stany (hover, active, focus, disabled)

### 2. Zmienne Design Systemu (Design Tokens)

**Kolory:**
- `Text/text-primary`: #161616
- `Default/Neutral/White`: #ffffff
- `Default/Neutral/Black`: #000000
- `Default/Blue/60`: #0f62fe
- `Default/Blue/40`: #78a9ff
- `Default/Blue/20`: #d0e2ff
- `Default/Blue/30`: #a6c8ff
- `Default/Blue/50`: #4589ff
- `Default/Purple/60`: #8a3ffc
- `Default/Gray/20`: #e0e0e0
- `Default/Gray/30`: #c6c6c6
- `Default/Gray/40`: #a8a8a8
- `Default/Gray/50`: #8d8d8d
- `Default/Gray/70`: #525252
- `Default/Gray/80`: #393939
- `Default/Gray/100`: #161616
- `General/Layer 01`: #f4f4f4
- `General/Text accent`: #0f62fe
- `General/Text 01`: #161616
- `General/Text 02`: #525252
- `General/Header`: #ffffff
- `General/Border`: #c6c6c6
- `Support/support-warning`: #f1c21b
- `Notification/notification-warning-background`: #fcf4d6
- `Notification/notification-warning-border`: #f1c21b4d

**Typografia:**
- **Font Family:** IBM Plex Sans
- **Rozmiary:** 14px, 42px, 132px (i inne)
- **Line Heights:** 18px, 50px, 146px (odpowiednio)
- **Letter Spacing:** 0, 0.16px
- **Weights:** Light (300), Regular (400), SemiBold (600)

**Spacing:**
- `spacing-05`: 16px

**Fixed Styles:**
- `heading-compact-01`: Font(family: "IBM Plex Sans", style: SemiBold, size: 14, weight: 600, lineHeight: 18, letterSpacing: 0.16)
- `body-compact-01`: Font(family: "IBM Plex Sans", style: Regular, size: 14, weight: 400, lineHeight: 18, letterSpacing: 0.16)

### 3. Motywy (Themes)

System używa Figma Variables do obsługi 4 motywów:
- White (domyślny)
- Gray 10
- Gray 90
- Gray 100

**Uwaga:** Wszystkie motywy są skonsolidowane w jednym pliku "(v11) All Themes - Carbon Design System".

## Komponenty do zaimplementowania

### Podstawowe komponenty Carbon (z @carbon/react)
1. **Button** - użyć bezpośrednio z @carbon/react, dostosować style
2. **Modal** - Carbon Modal dla formularzy
3. **DataTable** - dla listy planów
4. **Form** - Carbon Form components (TextInput, Select, DatePicker)
5. **Header** - Carbon Header dla nawigacji
6. **Grid** - Carbon Grid system dla layoutu
7. **List** - Carbon List dla sidebarów
8. **Toggle** - Carbon Toggle dla przełączników

### Własne komponenty (zgodne z Carbon)
Komponenty, które nie są dostępne w @carbon/react lub wymagają customizacji:
1. **MapView** - wrapper dla Leaflet z Carbon styling
2. **LocationMarker** - custom markery na mapie
3. **DaysSidebar** - sidebar z listą dni
4. **PlanCard** - karta planu podróży
5. **LocationCard** - karta lokalizacji w trybie listy

## Strategia implementacji

### Faza 1: Podstawowe komponenty Carbon
1. Zainstalować `@carbon/react`, `@carbon/styles`, `carbon-icons`
2. Skonfigurować Carbon styles w aplikacji
3. Zaimplementować podstawowe komponenty używając Carbon bezpośrednio

### Faza 2: Customizacja zgodna z designem
1. Utworzyć własne komponenty dla elementów niestandardowych
2. Używać Carbon tokens dla kolorów, typografii, spacing
3. Zachować spójność z Carbon Design Language

### Faza 3: Integracja z aplikacją
1. Zintegrować komponenty Carbon z React Router
2. Dostosować layout do mobile-first
3. Zaimplementować responsywność używając Carbon Grid

## Tokeny do użycia w kodzie

### Kolory (CSS Variables)
```css
--cds-text-primary: #161616;
--cds-text-secondary: #525252;
--cds-text-accent: #0f62fe;
--cds-background: #ffffff;
--cds-layer-01: #f4f4f4;
--cds-border: #c6c6c6;
--cds-blue-60: #0f62fe;
--cds-blue-40: #78a9ff;
--cds-gray-20: #e0e0e0;
--cds-gray-30: #c6c6c6;
```

### Typografia
```css
--cds-font-family: 'IBM Plex Sans', sans-serif;
--cds-body-01: 14px/18px 'IBM Plex Sans', Regular;
--cds-heading-compact-01: 14px/18px 'IBM Plex Sans', SemiBold;
```

### Spacing
```css
--cds-spacing-05: 16px;
```

## Uwagi implementacyjne

1. **Ikony:** Używać `carbon-icons` lub `@carbon/icons-react` dla ikon
2. **Responsywność:** Carbon Grid używa 16-kolumnowego systemu
3. **Accessibility:** Wszystkie komponenty Carbon są zgodne z WCAG
4. **Theming:** Carbon obsługuje motywy przez CSS variables
5. **Mobile-first:** Wszystkie komponenty są responsywne z mobile-first approach

## Pliki do utworzenia

1. `src/styles/carbon-overrides.scss` - nadpisania stylów Carbon
2. `src/components/carbon/CustomButton.tsx` - custom button jeśli potrzebny
3. `src/components/carbon/CustomModal.tsx` - custom modal jeśli potrzebny
4. `src/utils/carbon-tokens.ts` - eksport tokenów design systemu
5. `src/styles/carbon-theme.scss` - konfiguracja motywu Carbon

## Następne kroki

1. Przejrzeć więcej komponentów w Figma (Modal, Form, DataTable, Header)
2. Zidentyfikować wszystkie potrzebne komponenty dla aplikacji
3. Utworzyć mapowanie komponentów Figma -> @carbon/react
4. Zdefiniować custom komponenty wymagane dla aplikacji

