import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "votre@email.com",
        },
        password: {
          label: "Mot de passe",
          type: "password",
          placeholder: "••••••••",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            company: true,
          },
        });

        if (!user) {
          throw new Error("Aucun compte trouvé avec cet email");
        }

        if (!user.isActive) {
          throw new Error("Ce compte a été désactivé");
        }

        // Verify password
        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Mot de passe incorrect");
        }

        // Return user data without password
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          image: user.avatar,
          companyId: user.company?.id || null,
          companyName: user.company?.name || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.companyId = token.companyId as string | null;
        session.user.companyName = token.companyName as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
};

// Extend NextAuth types to include custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      firstName: string;
      lastName: string;
      companyId: string | null;
      companyName: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    firstName?: string;
    lastName?: string;
    role?: string;
    image?: string | null;
    companyId?: string | null;
    companyName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    companyId: string | null;
    companyName: string | null;
  }
}
