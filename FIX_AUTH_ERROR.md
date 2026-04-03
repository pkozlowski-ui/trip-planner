# Fix: auth/configuration-not-found Error

## Problem
Błąd "auth/configuration-not-found" z 400 Bad Request podczas rejestracji/logowania.

## Najczęstsze przyczyny:

### 1. Authentication nie jest włączone w Firebase Console ⚠️ NAJWAŻNIEJSZE

**To jest najczęstsza przyczyna tego błędu!**

#### Sprawdź i włącz Authentication:

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Wybierz projekt: **tripplanner-d4df2**
3. W menu po lewej stronie kliknij **"Authentication"**
4. Jeśli widzisz przycisk **"Get started"** - kliknij go
5. Przejdź do zakładki **"Sign-in method"**
6. Znajdź **"Email/Password"** na liście
7. Kliknij na **"Email/Password"**
8. Włącz przełącznik **"Enable"**
9. Kliknij **"Save"**

**Po włączeniu Authentication, spróbuj ponownie zarejestrować się.**

### 2. API Key Restrictions

Sprawdź czy API key nie ma restrykcji:

1. W Firebase Console przejdź do **Project Settings** > **General**
2. Przewiń do sekcji **"Your apps"**
3. Kliknij na aplikację webową
4. Sprawdź czy API Key nie ma ustawionych restrykcji HTTP referrers
5. Jeśli są restrykcje, dodaj `localhost:5173` do dozwolonych domen

### 3. Storage Bucket Format

Twój projekt używa nowego formatu Storage Bucket: `tripplanner-d4df2.firebasestorage.app`

To jest poprawne dla nowszych projektów Firebase. Upewnij się tylko, że:
- Storage jest włączone w Firebase Console
- Storage > Get started (jeśli jeszcze nie włączone)

### 4. Sprawdź czy projekt jest aktywny

1. W Firebase Console sprawdź czy projekt **tripplanner-d4df2** jest widoczny
2. Sprawdź czy nie ma komunikatów o zawieszeniu projektu
3. Upewnij się, że masz dostęp do projektu

## Debugowanie w przeglądarce

Otwórz konsolę przeglądarki (F12) i uruchom:

```javascript
debugFirebaseConfig()
```

To pokaże szczegółowy status konfiguracji Firebase.

## Krok po kroku - rozwiązanie:

### Krok 1: Włącz Authentication (NAJWAŻNIEJSZE!)
1. Firebase Console > Authentication > Get started
2. Sign-in method > Email/Password > Enable > Save

### Krok 2: Sprawdź Storage
1. Firebase Console > Storage > Get started (jeśli nie włączone)

### Krok 3: Zrestartuj serwer
```bash
# Zatrzymaj (Ctrl+C) i uruchom ponownie:
npm run dev
```

### Krok 4: Spróbuj ponownie
- Przejdź do `/login`
- Spróbuj zarejestrować się

## Jeśli nadal nie działa:

1. Sprawdź konsolę przeglądarki - czy są inne błędy?
2. Sprawdź Network tab w DevTools - jaki dokładny błąd zwraca API?
3. Upewnij się, że projekt Firebase jest aktywny i masz do niego dostęp

## Najczęstsze rozwiązanie:

**W 90% przypadków problem rozwiązuje się przez włączenie Authentication w Firebase Console!**

Upewnij się, że:
- ✅ Authentication > Sign-in method > Email/Password jest **ENABLED**
- ✅ Storage jest włączone (jeśli używasz Storage)
- ✅ Serwer został zrestartowany po zmianie .env.local

