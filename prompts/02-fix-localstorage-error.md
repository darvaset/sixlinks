# Gemini Prompt: Fix localStorage SSR Error

## Problem

The FootyLinks project is failing to start with this error:
```
TypeError: localStorage.getItem is not a function
```

This error occurs during SSR (Server-Side Rendering) because `localStorage` is a browser-only API and doesn't exist in Node.js.

## Context

- **Framework:** Next.js 15.3.4 with App Router
- **React:** 19.1.0
- **Framer Motion:** 12.19.1 (known to have SSR issues)
- The page at `src/app/page.tsx` was recently replaced with a simple version that does NOT use framer-motion
- However, the error persists - meaning something else is importing code that uses localStorage

## Your Task

1. **Find the source of the localStorage call:**
   - Search the entire `src/` directory for any use of `localStorage`
   - Check if any imported libraries are accessing localStorage during SSR
   - Common culprits: framer-motion, theme providers, analytics, state persistence libraries

2. **Check these specific files for issues:**
   - `src/app/layout.tsx` - may import problematic components
   - `src/components/` - any component using localStorage
   - `src/hooks/` - any hook using localStorage
   - `src/lib/` - any utility using localStorage

3. **Fix the issue using one of these approaches:**
   - Wrap localStorage calls in `typeof window !== 'undefined'` checks
   - Use dynamic imports with `{ ssr: false }` for problematic components
   - Remove unused imports that pull in problematic code
   - If framer-motion is the issue, either remove it or configure it properly

4. **Verify the fix:**
   ```bash
   rm -rf .next
   npm run dev
   ```
   The server should start without localStorage errors.

## Expected Outcome

- `npm run dev` starts without errors
- `http://localhost:3000` loads the development test page
- No localStorage-related errors in the console

## Files to Check First

```
src/app/layout.tsx
src/app/page.tsx
src/components/layout/GameHeader.tsx (uses framer-motion)
src/components/layout/StatsBar.tsx (uses framer-motion)
src/components/game/ConnectionResult.tsx (uses framer-motion)
```

## Quick Fix Approach

If you can't find the source quickly, the fastest fix is to remove framer-motion entirely for now:

1. Remove all framer-motion imports
2. Replace `motion.div` with regular `div`
3. Remove animation props

We'll add animations back later with proper SSR handling.

## Document Your Changes

After fixing, add a section to AGENT_LOG.md documenting:
- What was causing the error
- How you fixed it
- Any files modified
