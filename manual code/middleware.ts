/**
 * MIDDLEWARE
 *
 * Runs on every request BEFORE the page renders.
 * - Unauthenticated users hitting any /app route → redirected to /login
 * - Authenticated users hitting /login → redirected to /dashboard
 * - Public routes (/login, /api/auth/**) are always allowed through
 *
 * File location: middleware.ts  (project root, next to package.json)
 */

export { default } from "next-auth/middleware";

export const config = {
    /*
     * Match every route EXCEPT:
     *  - /login
     *  - /api/auth/**  (NextAuth endpoints)
     *  - /_next/**     (Next.js internals)
     *  - /favicon.ico, /images, etc. (static files)
     */
    matcher: [
        "/((?!login|api/auth|_next/static|_next/image|favicon.ico|images|icons).*)",
    ],
};
