import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      company: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    ...userWithoutPassword,
    role: session.user.role,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components and server actions
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  return session;
}

/**
 * Require specific role(s) - redirects if user doesn't have required role
 * @param roles - Array of allowed roles or a single role
 * @param redirectTo - Custom redirect path (default: "/dashboard")
 */
export async function requireRole(roles: UserRole | UserRole[], redirectTo = "/dashboard") {
  const session = await requireAuth();
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    // Redirect based on actual role
    const roleRedirects: Record<string, string> = {
      BUYER: "/dashboard/buyer",
      SUPPLIER: "/dashboard/seller",
      ADMIN: "/admin",
      SUPER_ADMIN: "/admin",
      MODERATOR: "/admin",
    };
    
    const redirectPath = roleRedirects[session.user.role] || redirectTo;
    redirect(redirectPath);
  }
  
  return session;
}

/**
 * Check if current user has a specific role
 * Returns boolean without redirecting
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === role;
}

/**
 * Check if current user is an admin (ADMIN or SUPER_ADMIN)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
}

/**
 * Check if current user is a supplier
 */
export async function isSupplier(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "SUPPLIER";
}

/**
 * Check if current user is a buyer
 */
export async function isBuyer(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "BUYER";
}

/**
 * Get role-based redirect path for after login
 */
export function getRoleBasedRedirect(role: string): string {
  const redirects: Record<string, string> = {
    BUYER: "/dashboard/buyer",
    SUPPLIER: "/dashboard/seller",
    MODERATOR: "/admin",
    ADMIN: "/admin",
    SUPER_ADMIN: "/admin",
  };
  
  return redirects[role] || "/dashboard";
}
