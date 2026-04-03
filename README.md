# Trip Planner

Interactive trip planning application with map visualization, built with React, TypeScript, Firebase, and Leaflet.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** Carbon Design System (@carbon/react)
- **Maps:** Leaflet + React-Leaflet (minimalist CartoDB Positron style)
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Routing:** React Router v6

## Project Status

### ✅ Completed (Faza 1-4: Setup, Authentication, Data Structure, UI Layout)

**Phase 1: Project Setup**
- ✅ Project setup with Vite + React + TypeScript
- ✅ Firebase configuration (Auth, Firestore, Storage)
- ✅ Carbon Design System integration
- ✅ Leaflet maps with minimalist styling
- ✅ React Router setup

**Phase 2: Authentication**
- ✅ Firebase Authentication (Email/Password)
- ✅ Google Sign-In
- ✅ Login/Register pages with Carbon components
- ✅ AuthContext for global auth state
- ✅ ProtectedRoute component
- ✅ PublicRoute component
- ✅ Redirect flow with return URL

**Phase 3: Data Structure**
- ✅ TypeScript type definitions (TripPlan, Day, Location, MediaItem)
- ✅ Firestore service with full CRUD operations
- ✅ TripPlansContext for state management
- ✅ Subcollections structure (tripPlans → days → locations)

**Phase 4: UI Layout**
- ✅ AppLayout component
- ✅ Header component with navigation
- ✅ Sidebar component with trip plan
- ✅ Dashboard with trip plans list
- ✅ Plan editor with map integration

### 🚧 In Progress

- Map markers for locations
- Location creation on map click
- Route visualization between locations
- Day management (add, reorder, delete)

### 📋 Planned

- Apple Sign-In
- Location editing and deletion UI
- Multimedia attachments (photos, YouTube, links)
- Search functionality
- Route calculation
- Offline mode (PWA)
- Sharing functionality

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (see `FIREBASE_SETUP.md`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create `.env.local` file (see `.env.local.example`)
   - Add your Firebase credentials from Firebase Console
   - See `FIREBASE_SETUP.md` for detailed instructions

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser

## Project Structure

```
src/
├── components/
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── map/            # Map-related components
│   ├── ProtectedRoute.tsx
│   └── PublicRoute.tsx
├── contexts/
│   ├── AuthContext.tsx      # Authentication context
│   └── TripPlansContext.tsx # Trip plans state management
├── pages/
│   ├── Login.tsx            # Login/Register page
│   ├── Dashboard.tsx        # Dashboard with plans list
│   └── PlanEditor.tsx       # Plan editor with map
├── services/
│   └── firebase/
│       ├── config.ts         # Firebase initialization
│       ├── auth.ts           # Authentication service
│       └── firestore.ts      # Firestore CRUD operations
├── types/
│   └── index.ts             # TypeScript type definitions
├── styles/                  # Global styles and Carbon overrides
├── utils/                   # Utility functions
└── App.tsx                  # Main app component with routing
```

## Documentation

- `IMPLEMENTATION_PLAN.md` - **Complete implementation plan with all 28 steps** ⭐
- `PROJECT_STATUS.md` - Detailed current progress
- `IMPLEMENTATION_SUMMARY.md` - Summary of completed phases
- `AUTH_IMPLEMENTATION.md` - Authentication and protected routes documentation
- `FIREBASE_SETUP.md` - Firebase configuration guide
- `FIREBASE_TROUBLESHOOTING.md` - Common Firebase issues and solutions
- `FIX_AUTH_ERROR.md` - Authentication error troubleshooting
- `CARBON_DESIGN_SYSTEM_ANALYSIS.md` - Carbon Design System reference
- `DESIGN_REFERENCE.md` - UI/UX design reference from Figma

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Debugging

In development mode, you can use Firebase debug utility in browser console:
```javascript
debugFirebaseConfig()
```

## Environment Variables

Required variables in `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Firebase Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Email/Password authentication
   - Google Sign-In provider
3. Enable Firestore Database (start in test mode for development)
4. Enable Storage
5. Copy configuration to `.env.local`

See `FIREBASE_SETUP.md` for detailed instructions.

## Design System

The application uses Carbon Design System for UI components. See `CARBON_DESIGN_SYSTEM_ANALYSIS.md` for component reference and design tokens.

## License

MIT

