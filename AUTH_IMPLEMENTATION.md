# Authentication & Protected Routes Implementation

## Przegląd

Implementacja pełnego systemu autentykacji z chronionymi trasami, wykorzystująca Firebase Authentication i React Router.

## Komponenty

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

Globalny context zarządzający stanem autentykacji użytkownika.

**Funkcjonalności:**
- Śledzenie stanu zalogowania użytkownika w czasie rzeczywistym
- Automatyczne aktualizowanie stanu przy zmianie autentykacji
- Loading state podczas inicjalizacji
- Funkcja `signOut()` do wylogowania

**API:**
```typescript
const { user, loading, signOut } = useAuth();
```

**Wartości:**
- `user: User | null` - aktualny użytkownik Firebase lub null
- `loading: boolean` - czy trwa sprawdzanie stanu autentykacji
- `signOut: () => Promise<void>` - funkcja wylogowania

### 2. ProtectedRoute (`src/components/ProtectedRoute.tsx`)

Komponent chroniący trasy wymagające autentykacji.

**Funkcjonalności:**
- Sprawdza czy użytkownik jest zalogowany
- Wyświetla loading state podczas sprawdzania
- Przekierowuje niezalogowanych użytkowników do `/login` z parametrem `from` (URL powrotu)
- Pozwala na dostęp tylko zalogowanym użytkownikom

**Użycie:**
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

**Przekierowanie:**
- Jeśli użytkownik nie jest zalogowany → `/login?from=/dashboard`
- Po zalogowaniu użytkownik zostanie przekierowany z powrotem do `/dashboard`

### 3. PublicRoute (`src/components/PublicRoute.tsx`)

Komponent dla tras publicznych (np. Login), które nie powinny być dostępne dla zalogowanych użytkowników.

**Funkcjonalności:**
- Sprawdza czy użytkownik jest zalogowany
- Przekierowuje zalogowanych użytkowników z powrotem (np. do Dashboard)
- Pozwala na dostęp tylko niezalogowanym użytkownikom

**Użycie:**
```tsx
<PublicRoute>
  <Login />
</PublicRoute>
```

**Przekierowanie:**
- Jeśli użytkownik jest zalogowany → `/dashboard` (lub URL z parametru `from`)

## Struktura tras w App.tsx

```tsx
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
  
  {/* Protected routes */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/plan/:planId" element={<ProtectedRoute><PlanEditor /></ProtectedRoute>} />
  <Route path="/plan/new" element={<ProtectedRoute><PlanEditor /></ProtectedRoute>} />
</Routes>
```

## Flow autentykacji

### 1. Próba dostępu do chronionej trasy bez logowania

```
User → /dashboard (ProtectedRoute)
  ↓
Sprawdzenie: user === null
  ↓
Redirect → /login?from=/dashboard
  ↓
Login page (PublicRoute)
  ↓
User loguje się
  ↓
Redirect → /dashboard (z parametru 'from')
```

### 2. Próba dostępu do Login gdy użytkownik jest zalogowany

```
User → /login (PublicRoute)
  ↓
Sprawdzenie: user !== null
  ↓
Redirect → /dashboard (lub URL z 'from')
```

### 3. Wylogowanie

```
User → Dashboard → Sign Out button
  ↓
signOut() z AuthContext
  ↓
Firebase Auth: signOut()
  ↓
AuthContext: setUser(null)
  ↓
ProtectedRoute wykrywa brak użytkownika
  ↓
Redirect → /login
```

## Integracja z komponentami

### Dashboard
```tsx
function Dashboard() {
  const { user, signOut } = useAuth();
  // user jest zawsze zdefiniowany dzięki ProtectedRoute
  // ...
}
```

### Login
```tsx
function Login() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Pobranie URL powrotu
  const getReturnUrl = () => {
    const from = searchParams.get('from');
    return from || '/dashboard';
  };
  
  // Po zalogowaniu
  navigate(getReturnUrl());
}
```

## Bezpieczeństwo

1. **Client-side protection**: ProtectedRoute chroni przed przypadkowym dostępem do chronionych stron
2. **Server-side validation**: Firebase Security Rules powinny być skonfigurowane w Firestore i Storage
3. **Token refresh**: Firebase automatycznie odświeża tokeny autentykacji
4. **Session persistence**: Firebase zapisuje sesję użytkownika w localStorage

## Loading States

- **AuthContext**: `loading: true` podczas inicjalnego sprawdzania stanu autentykacji
- **ProtectedRoute**: Wyświetla Carbon Loading podczas sprawdzania
- **PublicRoute**: Wyświetla Carbon Loading podczas sprawdzania

## Obsługa błędów

- **Network errors**: Obsługiwane przez Firebase SDK
- **Auth errors**: Wyświetlane w Login component jako InlineNotification
- **Redirect errors**: Fallback do `/dashboard` jeśli redirect URL jest nieprawidłowy

## Testowanie

### Scenariusze testowe:

1. ✅ Dostęp do `/dashboard` bez logowania → redirect do `/login`
2. ✅ Logowanie → redirect do `/dashboard` (lub poprzednia strona)
3. ✅ Dostęp do `/login` gdy zalogowany → redirect do `/dashboard`
4. ✅ Wylogowanie → redirect do `/login`
5. ✅ Odświeżenie strony na chronionej trasie → zachowanie sesji
6. ✅ Zamknięcie przeglądarki i ponowne otwarcie → zachowanie sesji (Firebase persistence)

## Następne kroki

- [ ] Dodanie Apple Sign-In
- [ ] Implementacja "Remember me" functionality
- [ ] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication (opcjonalnie)

