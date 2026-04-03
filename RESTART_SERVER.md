# Restart Server Instructions

## Problem
If you see slow loading or old code behavior, you need to restart the development server.

## Steps to Restart:

1. **Stop the current server:**
   - In the terminal where `npm run dev` is running, press `Ctrl+C` (or `Cmd+C` on Mac)

2. **Start the server again:**
   ```bash
   npm run dev
   ```

3. **Hard refresh the browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

4. **Clear browser cache (if needed):**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

## After Restart:
- Dashboard should load instantly (only 1 Firestore query)
- Check browser console for `[getTripPlans]` logs showing query time
- If still slow, check network tab for Firestore requests

