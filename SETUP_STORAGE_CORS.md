# Firebase Storage CORS Setup

## Problem
Firebase Storage blokuje uploady z powodu braku konfiguracji CORS.

## Rozwiązanie

### 1. Zainstaluj Google Cloud SDK (jeśli nie masz)

**macOS:**
```bash
brew install google-cloud-sdk
```

**Windows/Linux:**
https://cloud.google.com/storage/docs/gsutil_install

### 2. Zaloguj się do Google Cloud

```bash
gcloud auth login
```

### 3. Ustaw projekt Firebase

```bash
gcloud config set project tripplanner-d4df2
```

### 4. Zastosuj konfigurację CORS

```bash
gsutil cors set cors.json gs://tripplanner-d4df2.firebasestorage.app
```

### 5. Sprawdź czy CORS został zastosowany

```bash
gsutil cors get gs://tripplanner-d4df2.firebasestorage.app
```

## Co to robi?

Konfiguracja CORS pozwala przeglądarce na:
- Uploadowanie plików z localhost:5173 (dev)
- Uploadowanie plików z Firebase Hosting (production)
- Operacje GET, POST, PUT, DELETE na Storage

## Po zastosowaniu CORS

1. Odśwież przeglądarkę (Cmd+R lub Ctrl+R)
2. Spróbuj ponownie wgrać zdjęcie
3. Powinno działać! ✅

## Alternatywa: Firebase Console

Możesz też skonfigurować CORS przez Firebase Console:
1. Idź do: https://console.firebase.google.com/project/tripplanner-d4df2/storage
2. Kliknij na "Rules" tab
3. Ale gsutil jest prostsze!
