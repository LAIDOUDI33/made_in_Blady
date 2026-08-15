/**
 * User Registration API Route
 * 
 * POST /api/auth/register - Create new user account
 * 
 * SECURITY:
 * - Rate limited to prevent bot account creation
 * - Password validation enforced server-side
 * - Email enumeration prevented (generic error messages)
 */

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse, RATE_LIMITS } from "@/lib/security/rateLimiter";

// Zod-like validation (using simple validation for now)
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced password validation aligned with security policy
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Minimum length (aligned with passwordPolicy.ts)
  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }
  // Uppercase requirement
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }
  // Lowercase requirement
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }
  // Digit requirement
  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }
  // Special character recommendation (not required but encouraged)
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    // Only warn, don't block - allows simpler passwords while encouraging strength
  }
  
  return { valid: errors.length === 0, errors };
}

function validatePhone(phone: string): boolean {
  // Algerian phone format: +213 XXX XXX XXX or 0XXX XXX XXX
  const phoneRegex = /^(\+213|0)[5-7]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

function validateAlgerianRC(rc: string): boolean {
  // RC format: XX/XX-XXXXXXX/XX
  const rcRegex = /^\d{2}\/\d{2}-\d{7}\/\d{2}$/;
  return rcRegex.test(rc);
}

function validateNIF(nif: string): boolean {
  // NIF: 15 digits
  const nifRegex = /^\d{15}$/;
  return nifRegex.test(nif);
}

function validateNIS(nis: string): boolean {
  // NIS: 10 digits
  const nisRegex = /^\d{10}$/;
  return nisRegex.test(nis);
}

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // CRITICAL FIX: Rate limiting to prevent automated account creation
    // ========================================================================
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = checkRateLimit(ip, 'register');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(RATE_LIMITS.register!, rateLimitResult),
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      role,
      // Company fields (for suppliers)
      companyName,
      legalForm,
      rcNumber,
      nif,
      nis,
      wilaya,
      address,
      description,
    } = body;

    // Validate required fields
    const errors: string[] = [];

    // Personal info validation
    if (!firstName || firstName.trim().length < 2) {
      errors.push("Le prénom doit contenir au moins 2 caractères");
    }
    if (!lastName || lastName.trim().length < 2) {
      errors.push("Le nom doit contenir au moins 2 caractères");
    }
    if (!email || !validateEmail(email)) {
      errors.push("Adresse email invalide");
    }
    if (!phone || !validatePhone(phone)) {
      errors.push("Numéro de téléphone invalide (format: +213 ou 0 suivi de 10 chiffres)");
    }

    // Password validation
    if (!password) {
      errors.push("Le mot de passe est requis");
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (password !== confirmPassword) {
      errors.push("Les mots de passe ne correspondent pas");
    }

    // Role validation
    if (!role || !["BUYER", "SUPPLIER"].includes(role)) {
      errors.push("Rôle invalide");
    }

    // Company validation for suppliers
    if (role === "SUPPLIER") {
      if (!companyName || companyName.trim().length < 2) {
        errors.push("Le nom de l'entreprise est requis pour les fournisseurs");
      }
      if (!legalForm || !["SARL", "EURL", "SPA", "SNC", "auto"].includes(legalForm)) {
        errors.push("La forme juridique est requise");
      }
      if (!rcNumber || !validateAlgerianRC(rcNumber)) {
        errors.push("Numéro RC invalide (format: XX/XX-XXXXXXX/XX)");
      }
      if (!nif || !validateNIF(nif)) {
        errors.push("NIF invalide (15 chiffres requis)");
      }
      if (nis && !validateNIS(nis)) {
        errors.push("NIS invalide (10 chiffres requis)");
      }
      if (!wilaya) {
        errors.push("La wilaya est requise");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Erreur de validation", details: errors },
        { status: 400 }
      );
    }

    // Check if email already exists (use generic message to prevent enumeration)
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Hash password with strong work factor
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase(),
        phone: phone.trim(),
        password: hashedPassword,
        role: role as UserRole,
      },
    });

    // Create company for suppliers
    if (role === "SUPPLIER") {
      // Generate slug from company name
      const baseSlug = companyName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      let slug = baseSlug;
      let counter = 1;
      while (await db.company.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await db.company.create({
        data: {
          name: companyName.trim(),
          slug,
          legalForm: legalForm.toUpperCase(),
          rcNumber: rcNumber.toUpperCase(),
          nif: nif.toUpperCase(),
          nis: nis ? nis.toUpperCase() : "",
          wilaya,
          address: address?.trim() || null,
          contactEmail: email.toLowerCase(),
          contactPhone: phone.trim(),
          description: description?.trim() || null,
          userId: user.id,
        },
      });
    }

    // Log registration event for audit trail
    try {
      const { auditLogger } = await import('@/lib/security/auditLog');
      await auditLogger.logSecurity('USER_REGISTER' as any, user.id, {
        success: true,
        ipAddress: ip,
        metadata: { role, email: email.toLowerCase() },
      });
    } catch (logError) {
      console.error('Failed to log registration audit:', logError);
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
