import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    
    // If no token, redirect to login (handled by pages option, but just in case)
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    const userRole = token.role as string;
    
    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (!["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(userRole)) {
        // Redirect non-admins to their dashboard
        const roleRedirects: Record<string, string> = {
          BUYER: "/dashboard/buyer",
          SUPPLIER: "/dashboard/seller",
        };
        
        const redirectPath = roleRedirects[userRole] || "/dashboard";
        return NextResponse.redirect(new URL(redirectPath, req.url));
      }
    }
    
    // Seller/Supplier route protection
    if (pathname.startsWith("/dashboard/seller")) {
      if (userRole !== "SUPPLIER") {
        return NextResponse.redirect(new URL("/dashboard/buyer", req.url));
      }
    }
    
    // Buyer route protection
    if (pathname.startsWith("/dashboard/buyer")) {
      if (userRole !== "BUYER") {
        return NextResponse.redirect(new URL("/dashboard/seller", req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - api/register (registration endpoint)
     * - api/products (public product catalog)
     * - api/categories (public categories)
     * - api/search (public search)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - Login and register pages
     */
    "/((?!api/auth|api/register|api/products|api/categories|api/search|_next/static|_next/image|favicon.ico|logo|images|login|register|forgot-password|terms|privacy).*)",
  ],
};
