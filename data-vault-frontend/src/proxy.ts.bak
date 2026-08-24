import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/", // Redirect to root for login
    },
});

export const config = {
    matcher: [
        /*
         * Protect everything EXCEPT:
         * - api/auth (auth API routes)
         * - / (login page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images/assets
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
    ],
};
