import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { getUser, updateUserRole } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

export type UserType = "regular";
export type UserRole = "admin" | "user";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      role: UserRole;
      name?: string | null;
      gender?: string | null;
      birthDay?: number | null;
      birthMonth?: number | null;
      birthYear?: number | null;
    } & DefaultSession["user"];
  }

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: "Required"
  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    type: UserType;
    role: UserRole;
    gender?: string | null;
    birthDay?: number | null;
    birthMonth?: number | null;
    birthYear?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    role: UserRole;
    name?: string | null;
    gender?: string | null;
    birthDay?: number | null;
    birthMonth?: number | null;
    birthYear?: number | null;
  }
}

// Use secure cookies only in production with HTTPS
const useSecureCookies = process.env.NODE_ENV === "production";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? "__Secure-authjs.callback-url" : "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: useSecureCookies ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        const adminEmails = process.env.ADMIN?.split(',').map(email => email.trim()) || [];
        console.log("Auth Debug: User email:", user.email);
        console.log("Auth Debug: Admin emails:", adminEmails);
        const userRole: UserRole = adminEmails.includes(user.email || '') ? "admin" : "user";
        console.log("Auth Debug: Assigned role:", userRole);
        console.log("Auth Debug: User object:", user);

        if (userRole !== user.role) {
          await updateUserRole(user.id, userRole);
        }

        return {
          ...user,
          type: "regular" as UserType,
          role: userRole
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.role = user.role;
        token.name = user.name;
        token.gender = user.gender;
        token.birthDay = user.birthDay;
        token.birthMonth = user.birthMonth;
        token.birthYear = user.birthYear;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.gender = token.gender;
        session.user.birthDay = token.birthDay;
        session.user.birthMonth = token.birthMonth;
        session.user.birthYear = token.birthYear;
      }

      return session;
    },
  },
});
