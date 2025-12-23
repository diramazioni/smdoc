/**
 * Authentication Configuration
 * 
 * Environment Variables:
 * - AUTH_MODE: 'edit-only' (default) | 'all-protected'
 *   - edit-only: Only /edit routes require authentication
 *   - all-protected: All routes require authentication except public routes
 */

export const AUTH_MODE = process.env.AUTH_MODE || 'edit-only' as const;

export type AuthMode = 'edit-only' | 'all-protected';

export function getAuthMode(): AuthMode {
	return AUTH_MODE;
}
