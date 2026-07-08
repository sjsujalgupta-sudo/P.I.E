/**
 * NEXTAUTH CONFIGURATION
 * File location: app/api/auth/[...nextauth]/route.ts
 *
 * Configures:
 *  - Google OAuth provider
 *  - Apple OAuth provider
 *  - Demo credentials provider (no real account needed)
 *
 * Set these environment variables in .env.local:
 *   NEXTAUTH_SECRET=<random-32-char-string>
 *   NEXTAUTH_URL=http://localhost:3000
 *   GOOGLE_CLIENT_ID=...
 *   GOOGLE_CLIENT_SECRET=...
 *   APPLE_CLIENT_ID=...
 *   APPLE_CLIENT_SECRET=...
 */

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider  from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,

    providers: [
        GoogleProvider({
            clientId:     process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        AppleProvider({
            clientId:     process.env.APPLE_CLIENT_ID!,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
        }),

        /* Demo login — works without any OAuth setup */
        CredentialsProvider({
            id: "credentials",
            name: "Demo",
            credentials: {
                email:    { label: "Email",    type: "email"    },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                /* Allow the hard-coded demo account */
                if (
                    credentials?.email    === "demo@datavault.test" &&
                    credentials?.password === "demo"
                ) {
                    return {
                        id:    "demo-user",
                        name:  "Demo User",
                        email: "demo@datavault.test",
                        image: null,
                    };
                }
                /* Return null → credentials rejected */
                return null;
            },
        }),
    ],

    pages: {
        signIn:  "/login",
        error:   "/login",
    },

    session: {
        strategy: "jwt",
        maxAge:   30 * 24 * 60 * 60, /* 30 days */
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        async session({ session, token }) {
            if (session.user) (session.user as { id?: string }).id = token.id as string;
            return session;
        },
    },
});

export { handler as GET, handler as POST };
