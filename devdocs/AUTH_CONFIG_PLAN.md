# Authentication Configuration System - Implementation Plan

## Current System Analysis

### Existing Authentication Flow

**File**: `src/hooks.server.ts`

**Current Behavior**:
1. **Handle 1** (lines 6-18):
   - Sets `event.locals.user` from `authenticateUser(event)`
   - Protects ONLY `/edit` routes with redirect if not authenticated
   - All other routes are publicly accessible

2. **Handle 2** (lines 20-58) - Main Auth Logic:
   - Checks for session cookie
   - Defines `publicRoutes = ['/login', '/logout', '/register', '/api']`
   - If no session AND route not in `publicRoutes` → redirect to login
   - Loads user from database using session token
   - Sets `event.locals.user` if user found

### Key Functions Used
- `authenticateUser(event)` - Validates user session
- `db.user.findUnique()` - Loads user from database

## Proposed Configuration System

### Configuration Options

**Mode 1: `edit-only` (Current Default)**
- `/edit` routes require authentication
- All other routes are publicly accessible
- Authenticated users can access everything

**Mode 2: `all-protected` (New Option)**
- All routes require authentication EXCEPT those in `publicRoutes` array
- Only `/login`, `/logout`, `/register`, `/api` routes are public
- Authenticated users can access all routes

### Configuration Storage

**Option A: Environment Variable** (Recommended)
```bash
# .env file
AUTH_MODE=edit-only  # or: all-protected
```

**Option B: Database Configuration Table**
```sql
CREATE TABLE config (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- Insert default config
INSERT INTO config (id, key, value) VALUES ('auth_mode', 'edit-only');
```

**Option C: Config File**
```typescript
// src/lib/config.ts
export const AUTH_MODE = process.env.AUTH_MODE || 'edit-only';
export type AuthMode = 'edit-only' | 'all-protected';
```

### Recommended: Option A (Environment Variable)

**Why**:
- Easy to change per deployment
- No database changes needed
- Can be different per environment (dev/staging/prod)
- Follows 12-factor app best practices

## Implementation Plan

### Phase 1: Add Configuration Infrastructure

**1.1 Create Config Module**
```typescript
// src/lib/config.ts
export const AUTH_MODE = process.env.AUTH_MODE || 'edit-only' as AuthMode;

export type AuthMode = 'edit-only' | 'all-protected';

export function getAuthMode(): AuthMode {
  return AUTH_MODE;
}
```

**1.2 Update Environment Variables**
```bash
# .env
AUTH_MODE=edit-only
```

### Phase 2: Modify Hooks

**2.1 Update First Handle** (`src/hooks.server.ts` lines 6-18)

**Current Code**:
```typescript
export const handle: Handle = async ({ event, resolve }) => {
    event.locals.user = await authenticateUser(event)
    if (event.url.pathname.startsWith('/edit') ) {
        console.log('protected')
        if (!event.locals.user) {
            console.log('not authenticated')
            throw redirect(302, '/')
        }
    }
    const response = await resolve(event);
    return response;
}
```

**New Code**:
```typescript
import { getAuthMode, type AuthMode } from '$lib/config';

export const handle: Handle = async ({ event, resolve }) => {
    const authMode = getAuthMode();
    event.locals.user = await authenticateUser(event);

    // Apply protection based on AUTH_MODE
    if (authMode === 'edit-only') {
        // Current behavior: protect only /edit routes
        if (event.url.pathname.startsWith('/edit')) {
            if (!event.locals.user) {
                throw redirect(302, '/login?redirectTo=' + encodeURIComponent(event.url.pathname));
            }
        }
    } else if (authMode === 'all-protected') {
        // New behavior: protect all routes except publicRoutes
        const publicRoutes = ['/login', '/logout', '/register', '/api'];
        const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));

        if (!isPublicRoute && !event.locals.user) {
            throw redirect(302, '/login?redirectTo=' + encodeURIComponent(event.url.pathname));
        }
    }

    const response = await resolve(event);
    return response;
}
```

**2.2 Update Second Handle** (`src/hooks.server.ts` lines 20-58)

The second handle already has the logic to protect routes based on `publicRoutes`. We need to make this conditional based on AUTH_MODE.

**Current Code** (lines 28-41):
```typescript
const session = event.cookies.get('session')
const publicRoutes = ['/login', '/logout', '/register', '/api'];
const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));

if (!session) {
    if (!isPublicRoute) {
        redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`)
    }
    return await resolve(event)
}
```

**New Code**:
```typescript
const session = event.cookies.get('session')
const authMode = getAuthMode();

// Only apply public route check in 'all-protected' mode
if (authMode === 'all-protected') {
    const publicRoutes = ['/login', '/logout', '/register', '/api'];
    const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));

    if (!session && !isPublicRoute) {
        redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`)
    }
    return await resolve(event)
}

// In 'edit-only' mode, allow access without session
// (first handle already protects /edit routes)
if (authMode === 'edit-only') {
    return await resolve(event)
}
```

### Phase 3: Add Configuration UI (Optional but Recommended)

**3.1 Create Settings Page**
```typescript
// src/routes/settings/+page.server.ts
import { db } from '$lib/server/database';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
    const config = await db.config.findUnique({
        where: { id: 'auth_mode' }
    });

    return {
        authMode: config?.value || 'edit-only'
    };
};

// src/routes/settings/+page.server.ts (action)
import { fail } from '@sveltejs/kit';

export const actions = {
    updateAuthMode: async ({ request }) => {
        const formData = await request.formData();
        const authMode = formData.get('authMode') as AuthMode;

        await db.config.upsert({
            where: { id: 'auth_mode' },
            update: { value: authMode }
        });

        return { success: true };
    }
};
```

**3.2 Create Settings UI**
```svelte
<!-- src/routes/settings/+page.svelte -->
<script lang="ts">
    import type { AuthMode } from '$lib/config';
    import { enhance } from '$app/forms';

    let { data } = $props();

    const modes: { value: AuthMode; label: string; description: string }[] = [
        {
            value: 'edit-only',
            label: 'Solo /edit (Modalità Attuale)',
            description: 'Solo le pagine di modifica richiedono autenticazione. Tutte le altre pagine sono pubbliche.'
        },
        {
            value: 'all-protected',
            label: 'Tutto Protetto',
            description: 'Tutte le pagine richiedono autenticazione. Solo /login, /logout, /register e /api sono pubbliche.'
        }
    ];
</script>

<div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Impostazioni Autenticazione</h1>

    <form method="POST" action="/settings?/updateAuthMode" use:enhance>
        <div class="space-y-4">
            {#each modes as mode}
                <label class="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <input
                        type="radio"
                        name="authMode"
                        value={mode.value}
                        checked={data.authMode === mode.value}
                        class="h-5 w-5"
                    />
                    <div>
                        <div class="font-semibold">{mode.label}</div>
                        <div class="text-sm text-muted-foreground">{mode.description}</div>
                    </div>
                </label>
            {/each}
        </div>

        <button
            type="submit"
            class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90"
        >
            Salva Configurazione
        </button>
    </form>
</div>
```

### Phase 4: Add Public Routes Configuration (Advanced)

**4.1 Make publicRoutes Configurable**

If you want to allow admins to configure which routes are public:

```typescript
// src/lib/config.ts
export const PUBLIC_ROUTES = process.env.PUBLIC_ROUTES 
    ? process.env.PUBLIC_ROUTES.split(',')
    : ['/login', '/logout', '/register', '/api'];

export function getPublicRoutes(): string[] {
    return PUBLIC_ROUTES;
}
```

```bash
# .env
PUBLIC_ROUTES=/login,/logout,/register,/api,/home
```

**4.2 Update hooks to use configurable publicRoutes**

```typescript
import { getPublicRoutes } from '$lib/config';

const publicRoutes = getPublicRoutes();
const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));
```

### Phase 5: Documentation

**5.1 Update README**

```markdown
# Authentication Configuration

## Environment Variables

| Variable | Description | Default | Options |
|-----------|-------------|---------|----------|
| `AUTH_MODE` | Authentication mode | `edit-only` | `edit-only`, `all-protected` |
| `PUBLIC_ROUTES` | Public routes (comma-separated) | `/login,/logout,/register,/api` | Any route paths |

## Modes

### edit-only (Default)
- Only `/edit` routes require authentication
- All other routes are publicly accessible
- Use this for public documentation sites or blogs

### all-protected
- All routes require authentication except those in `PUBLIC_ROUTES`
- Only `/login`, `/logout`, `/register`, and `/api` routes are public
- Use this for private admin panels or internal tools
```

## Migration Strategy

### Step 1: Add Config Module
- Create `src/lib/config.ts`
- Add AUTH_MODE environment variable
- Add PUBLIC_ROUTES optional variable

### Step 2: Update Hooks
- Modify `src/hooks.server.ts` first handle to check AUTH_MODE
- Modify `src/hooks.server.ts` second handle to conditionally apply protection

### Step 3: Testing
- Test with `AUTH_MODE=edit-only` (should work like before)
- Test with `AUTH_MODE=all-protected` (should protect all routes)
- Test that publicRoutes are always accessible
- Test login/logout flows

### Step 4: Deployment
- Update `.env` files for different environments
- Document configuration in README

## Backward Compatibility

✅ **Fully Backward Compatible**
- Default `AUTH_MODE=edit-only` maintains current behavior
- No breaking changes to existing code
- Gradual migration possible

## Testing Plan

### Unit Tests Needed
```typescript
// src/lib/tests/config.test.ts
import { describe, it, expect } from 'vitest';
import { getAuthMode, getPublicRoutes } from '$lib/config';

describe('Auth Configuration', () => {
    describe('getAuthMode', () => {
        it('should return edit-only by default', () => {
            process.env.AUTH_MODE = undefined;
            expect(getAuthMode()).toBe('edit-only');
        });

        it('should return configured mode', () => {
            process.env.AUTH_MODE = 'all-protected';
            expect(getAuthMode()).toBe('all-protected');
        });

        it('should throw on invalid mode', () => {
            process.env.AUTH_MODE = 'invalid';
            expect(() => getAuthMode()).toThrow();
        });
    });

    describe('getPublicRoutes', () => {
        it('should return default public routes', () => {
            process.env.PUBLIC_ROUTES = undefined;
            expect(getPublicRoutes()).toEqual(['/login', '/logout', '/register', '/api']);
        });

        it('should parse comma-separated routes', () => {
            process.env.PUBLIC_ROUTES = '/login,/home,/api';
            expect(getPublicRoutes()).toEqual(['/login', '/home', '/api']);
        });
    });
});
```

### Integration Tests Needed

1. **Test edit-only mode**:
   - Visit `/` without login → should work
   - Visit `/edit` without login → redirect to `/login`
   - Visit `/edit` with login → should work
   - Visit `/login` without login → should work
   - Visit `/api/test` without login → should work

2. **Test all-protected mode**:
   - Visit `/` without login → redirect to `/login`
   - Visit `/edit` without login → redirect to `/login`
   - Visit `/login` without login → should work
   - Visit `/api/test` without login → should work
   - Visit `/home` (if in PUBLIC_ROUTES) without login → should work
   - Visit any route with login → should work

## Edge Cases to Consider

1. **Session Expired**: Ensure redirect happens on expired sessions
2. **Invalid Session**: Handle gracefully with redirect
3. **API Routes**: Ensure `/api/*` routes are always public (or configurable)
4. **Static Assets**: Ensure `/static/*` is always accessible
5. **Webhooks**: External callbacks should work without authentication
6. **Redirect Loops**: Prevent infinite redirect loops
7. **XSS in Redirect**: Use `encodeURIComponent` for redirectTo parameter

## Implementation Order

**Priority 1: Core Functionality** (Required)
1. Create `src/lib/config.ts`
2. Add `AUTH_MODE` environment variable
3. Update `src/hooks.server.ts` first handle
4. Update `src/hooks.server.ts` second handle

**Priority 2: Advanced Features** (Optional)
1. Add `PUBLIC_ROUTES` configuration
2. Create settings page UI
3. Add database config storage
4. Add documentation

**Priority 3: Testing & Polish**
1. Add unit tests
2. Add integration tests
3. Update README
4. Test in different environments

## Summary

This plan provides a flexible, backward-compatible way to configure authentication modes without breaking existing functionality. The environment variable approach is recommended for its simplicity and deployment flexibility.

**Estimated Implementation Time**: 2-4 hours for core functionality
**Risk Level**: Low (backward compatible, optional features)
**Breaking Changes**: None (default maintains current behavior)
