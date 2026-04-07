---
name: Chat UX Strategy Plan
overview: "Dwuetapowa strategia: (A) Dashboard Wizard — konwersacyjny onboarding zastępujący pusty modal, który prowadzi backpackera od marzenia do gotowego szkieletu planu; (B) Plan Editor Co-pilot — rozbudowanie istniejącego czata o bogatszy kontekst, nowe narzędzia i proaktywne sugestie, tak by AI naprawdę znało plan i mogło działać, nie tylko odpowiadać."
todos:
  - id: A1-dashboard-layout
    content: "Dashboard: layout z panelem Wizard po prawej, lista planów po lewej, Quick Mode escape hatch"
    status: completed
  - id: A2-wizard-flow
    content: "Wizard: 5-7 pytań konwersacyjnych z chipami, skippowalność, backpackerski język"
    status: completed
  - id: A3-skeleton-generation
    content: "Tambo tools dla Wizarda: create_plan_from_wizard, geocode_cities; generowanie szkieletu z flagami anchor/szkic"
    status: completed
  - id: A4-reveal-animation
    content: "Reveal sequence: animacja wejścia do Plan Editora (pins drop, polyline draw, sidebar slide-in)"
    status: completed
  - id: B1-richer-context
    content: "Rozszerzyć buildPlanSummaryContextHelper: daty, koordynaty, kategorie, istniejące transporty"
    status: completed
  - id: B2-new-tools
    content: "Nowe Tambo tools: move_location (P0), estimate_day_travel_time (P0), update_location_notes (P1), reorder_day (P1)"
    status: completed
  - id: B3-system-prompt
    content: "Zaktualizować TAMBO_CUSTOM_INSTRUCTIONS: top 5 use cases (feasibility, seasonal, budget, gap, reorder)"
    status: completed
  - id: B4-proactive
    content: "Proaktywne suggestion chips w ChatPanel (rate-limited, 3 triggery: busy day, empty day 1, duplicate city)"
    status: completed
  - id: B5-empty-state
    content: Nowy empty state czata z konkretnym example prompt zamiast ogólnego placeholdera
    status: completed
isProject: false
---

# Chat UX — Plan Biznesowo-UX

## Aktualny stan (co już jest)

Tambo-based chat istnieje **wyłącznie w Plan Editorze**. Narzędzia:
- `get_plan_summary`, `search_places`, `add_location_to_plan`, `add_day`, `add_transport`
- Generative UI: `ChatPlaceTiles` (PlaceTiles komponent działa), `ChatMiniMap` (zarejestrowany ale wyłączony)
- Kontekst: nazwy i ID lokalizacji, viewbox mapy — brak dat planu, współrzędnych, transportów, kategorii

Luki:
- Brak czata na Dashboard
- Brak narzędzi: move/reorder/delete/update lokalizacji
- Kontekst nie zawiera dat, godzin, kategorii, szacowanych czasów podróży
- Chat 100% reaktywny — brak proaktywnych sugestii

---

## FAZA A — Dashboard Wizard ("Gdzie marzysz o wyjeździe?")

### Cel
Chat jako główny entry point na Dashboard. Modal "quick mode" zostaje jako escape hatch dla powracających użytkowników.

### A1 — Layout Dashboard z panelem Wizard

Obecny `Dashboard.tsx` nie ma TamboProvider. Do dodania:
- `TamboProvider` przeniesiony wyżej (do `App.tsx`) lub owinąć Dashboard oddzielnie
- Dwukolumnowy layout: lewa kolumna = lista planów + `[+ Quick mode]`, prawa kolumna = panel Wizard
- Na mobile: Wizard jako sticky bottom-sheet, lista planów za nim

Kluczowy plik: [`src/pages/Dashboard.tsx`](src/pages/Dashboard.tsx)

### A2 — Conversation Flow Wizarda (5-7 wymian)

Sekwencja pytań z progresywnym ujawnianiem:

```
1. Destination      → "Gdzie marzysz pojechać?"
                      Chips: [Southeast Asia] [Japan] [Bałkany] [Surprise me]
                      
2. When / Duration  → Daty albo liczba dni
                      Warunkowe: jeśli konkretny miesiąc → tip pogodowy/sezonowy
                      
3. Vibe             → Siatka chipów multi-select (max 3):
                      [Slow & deep] [Move fast] [Food-obsessed]
                      [History & culture] [Nature first] [Budget king]
                      
4. Group            → [Solo] [2 osoby] [3-4] [Większa grupa]

5. Budget/day       → [<$30] [$30-60] [$60-100] [$100+] [Skip]

6. Anchor           → "Coś obowiązkowego?" → free text albo "Nope, all open"
```

Każde pytanie skippable (poza pierwszym). Maksymalnie 7 wymian. Język: bezpośredni, backpackerski, nie korporacyjny.

Nowe narzędzia Tambo dla Wizarda:
- `create_plan_from_wizard(destination, days, vibe, budget, anchors)` — tworzy plan + dni + gecokoduje miasta
- `geocode_cities(destination)` — geocoding regionu do previewu mapy podczas rozmowy

### A3 — Generacja szkieletu planu

Co AI generuje po ukończeniu Wizarda:
- Plan z tytułem (auto: "Vietnam • Październik • 21 dni")
- Dni podzielone na bloki geograficzne (np. Hanoi 1-5, Hội An 6-10...)
- Każdy dzień: jedno główne miasto geocodowane, notatka kontekstowa
- Kotwice (anchory) użytkownika oznaczone specjalną flagą w Firestore (`isAnchor: true`)
- Wizualny treatment szkieletu w edytorze: przerywana linia, badge "Szkic"

**Generation moment** — UI theater ważny dla budowania zaufania:
```
✦ Mapuję trasę: Hanoi → Hội An → Sajgon
✦ Rozdzielam 21 dni na 3 regiony
✦ Zaznaczam kotwice i przesiadki
```
(animacja ~1.5s, każda linia pojawia się z 300ms opóźnieniem)

### A4 — Przejście do Plan Editora (Reveal Sequence)

Moment emocjonalnej kulminacji — musi być dopracowany:
1. Panel czata wysuwa się w lewo (250ms ease-in)
2. Mapa rozciąga się na całą szerokość (współbieżnie)
3. `flyToBounds` do wszystkich kotwic (Leaflet, 800ms)
4. Piny opadają jeden po jednym z dźwiękowym efektem (stagger 150ms, scale z 0 z ease-out-back)
5. Linia trasy rysuje się sama (stroke-dashoffset animation, 600ms)
6. Sidebar wsuwa się z lewej z dniami (stagger 60ms/dzień)
7. Toast: "Twój szkielet jest gotowy. Kliknij dzień, żeby go wypełnić →"

---

## FAZA B — Plan Editor Co-pilot Enhancement

### B1 — Bogatszy kontekst dla AI

Rozszerzenie `buildPlanSummaryContextHelper` w [`src/agent/tamboTools.ts`](src/agent/tamboTools.ts):

```typescript
// Do dodania w kontekście:
startDate, endDate,                    // dla porad sezonowych (#2)
days[].locationCoordinates[],          // dla feasibility (#1), optymalizacji (#6)
days[].locations[].category,           // dla estymacji czasu wizyty (#1)
days[].existingTransports[].time,      // dla pełnego obrazu dnia (#1)
```

### B2 — Nowe narzędzia (Tools) Tambo

Priorytet P0 (najwyższy impact):
- `move_location(locationId, fromDayId, toDayId, newOrder)` — eksponuje istniejącą funkcję Firestore
- `estimate_day_travel_time(dayId)` — używa istniejącego `calculateRoute`, zwraca sumaryczny czas

Priorytet P1:
- `update_location_notes(locationId, notes)` — eksponuje `updateLocation`
- `reorder_day_locations(dayId, orderedLocationIds[])` — batch update pola `order`

Priorytet P2 (z potwierdzeniem):
- `delete_location_with_confirmation(locationId)` — zawsze pyta przed usunięciem

### B3 — Top 5 przypadków użycia do zaimplementowania w system prompt

1. **Feasibility check** ("Dzień 3 ma 5 miejsc...") — wymaga B1 + `estimate_day_travel_time`
2. **Sezonowe porady datowe** ("Kyoto dzień 4 = 23 marca, blisko peak cherry blossom...") — wymaga `startDate` w kontekście
3. **Estymacja budżetu** ("Dzień 2 w Porto to ok. €25–35 licząc transport...") — wymaga kategorii lokalizacji
4. **Gap analysis** ("Dzień 5 jest prawie pusty, okolica X ma świetne Y...") — wymaga koordynat + `search_places`
5. **Optymalizacja kolejności** ("Ta trasa cofa się 3km, zamień kolejność 2 i 3...") — wymaga koordynat

### B4 — Proaktywne sugestie (rate-limited)

Trigger chips pojawiają się w panelu czata gdy:
- Dzień osiągnie ≥4 lokalizacje → "Dzień N robi się tłoczny — sprawdzić feasibility?"
- Dzień 1 ma 0 lokalizacji a plan ma datę → "Dzień przybycia pusty — sugestie na jetlag-friendly start?"
- Dwa kolejne dni w tym samym mieście → "Dni X i Y oba w [mieście] — zoptymalizować kolejność?"

Zasada: maks. 1 proaktywna sugestia per sesja edycji, tylko przy silnym sygnale.

### B5 — Lepszy empty state

Obecny: ogólny placeholder.
Nowy (gdy chat otwarty, plan załadowany):
> "Zapytaj mnie o cokolwiek — czy dzień 3 jest do zrobienia w jeden dzień, co zjeść przy lokalizacjach z dnia 2, albo ile to wszystko kosztuje."

---

## Balans Desirability / Feasibility / Viability

| Filar | Decyzja |
|---|---|
| Desirability | Backpackerzy chcą: research w 1/4 czasu, blank-page solver, budget tracking, "czy to realistyczne?" — priorytetujemy feasibility check i wizard |
| Feasibility | AI jest silne w: generowaniu szkieletu, sezonowych poradach, logistyce — unikamy live prices/opening hours bez prawdziwych danych |
| Viability | Trip saved = user anchored. Cel: jak najszybciej doprowadzić do zapisanego planu (Wizard). Co-pilot buduje sticky habit przez utility, nie engagement metrics |

---

## Czego NIE robimy (Anti-patterns z badań)

- Nie halucynujemy godzin otwarcia ani cen — zamiast tego: "verify before visiting"
- AI nie dodaje lokalizacji bez pokazania PlaceTiles i potwierdzenia
- Nie przepytujemy user przed odpowiedzią jeśli kontekst jest w planie
- Wizard jest opcjonalny — Quick Mode zawsze dostępny
- Proaktywne sugestie max 1/sesja, nigdy jako popup

---

## Sekwencja implementacji

- **Sprint 1:** Dashboard Wizard UI + conversation flow (A1, A2) — bez AI, statyczny UX
- **Sprint 2:** Tambo tools dla Wizarda + generacja szkieletu (A3) + reveal animation (A4)
- **Sprint 3:** Richer context helper (B1) + narzędzia move/estimate (B2)
- **Sprint 4:** System prompt dla top 5 use cases (B3) + proaktywne triggery (B4) + empty state (B5)
