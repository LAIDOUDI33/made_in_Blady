/**
 * Theme Generator for Multi-Tenant System
 * Generates CSS variables and theme configurations from tenant settings
 */

import { Tenant, ThemeConfig } from './tenantResolver';

/**
 * Generate CSS custom properties (variables) from tenant theme
 */
export function generateCSSVariables(theme: ThemeConfig): string {
  const { colors, branding, borderRadius, fonts } = theme;
  
  return `
    :root {
      /* Primary Colors */
      --primary: ${colors.primary};
      --primary-foreground: #ffffff;
      --secondary: ${colors.secondary};
      --secondary-foreground: #ffffff;
      
      /* Background & Surface Colors */
      --background: ${colors.background};
      --foreground: ${colors.text};
      --card: ${colors.surface};
      --card-foreground: ${colors.text};
      --popover: ${colors.surface};
      --popover-foreground: ${colors.text};
      
      /* Text Colors */
      --muted: ${colors.textMuted};
      --muted-foreground: ${colors.textMuted};
      
      /* Border & Accent */
      --border: ${colors.border};
      --input: ${colors.border};
      --accent: ${colors.accent};
      --accent-foreground: ${colors.primary};
      
      /* Status Colors */
      --destructive: ${colors.error};
      --destructive-foreground: #ffffff;
      --success: ${colors.success};
      --warning: ${colors.warning};
      
      /* Rounded Corners */
      --radius: ${borderRadius};
      
      /* Fonts */
      --font-heading: ${fonts.heading};
      --font-body: ${fonts.body};
      
      /* Branding */
      --brand-name: '${branding.name}';
    }
    
    /* Dark mode overrides - can be customized per tenant later */
    .dark {
      --background: #0a0a0a;
      --foreground: #fafafa;
      --card: #1a1a1a;
      --card-foreground: #fafafa;
      --popover: #1a1a1a;
      --popover-foreground: #fafafa;
      --muted: #262626;
      --muted-foreground: #a3a3a3;
      --border: #262626;
      --input: #262626;
      --accent: ${colors.primary}40;
      --accent-foreground: ${colors.primary};
    }
  `;
}

/**
 * Generate inline styles for dynamic theming
 * Useful for email templates and server-rendered content
 */
export function generateInlineStyles(theme: ThemeConfig): Record<string, string> {
  return {
    '--primary': theme.colors.primary,
    '--secondary': theme.colors.secondary,
    '--background': theme.colors.background,
    '--foreground': theme.colors.text,
    '--radius': theme.borderRadius,
  };
}

/**
 * Generate Tailwind-compatible color palette from primary/secondary colors
 */
export function generateColorPalette(primaryColor: string, secondaryColor: string) {
  return {
    primary: {
      50: lightenColor(primaryColor, 95),
      100: lightenColor(primaryColor, 90),
      200: lightenColor(primaryColor, 75),
      300: lightenColor(primaryColor, 60),
      400: lightenColor(primaryColor, 45),
      500: primaryColor,
      600: darkenColor(primaryColor, 10),
      700: darkenColor(primaryColor, 20),
      800: darkenColor(primaryColor, 30),
      900: darkenColor(primaryColor, 40),
      950: darkenColor(primaryColor, 50),
    },
    secondary: {
      50: lightenColor(secondaryColor, 95),
      100: lightenColor(secondaryColor, 90),
      200: lightenColor(secondaryColor, 75),
      300: lightenColor(secondaryColor, 60),
      400: lightenColor(secondaryColor, 45),
      500: secondaryColor,
      600: darkenColor(secondaryColor, 10),
      700: darkenColor(secondaryColor, 20),
      800: darkenColor(secondaryColor, 30),
      900: darkenColor(secondaryColor, 40),
      950: darkenColor(secondaryColor, 50),
    },
  };
}

/**
 * Lighten a hex color by percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * (percent / 100)),
    Math.round(rgb.g + (255 - rgb.g) * (percent / 100)),
    Math.round(rgb.b + (255 - rgb.b) * (percent / 100))
  );
}

/**
 * Darken a hex color by percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    Math.round(rgb.r * (1 - percent / 100)),
    Math.round(rgb.g * (1 - percent / 100)),
    Math.round(rgb.b * (1 - percent / 100))
  );
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle shorthand hex
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Calculate contrasting text color (black or white)
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Generate gradient from primary to secondary color
 */
export function generateGradient(
  direction: string = '135deg',
  primaryColor: string,
  secondaryColor: string
): string {
  return `linear-gradient(${direction}, ${primaryColor}, ${secondaryColor})`;
}

/**
 * Generate complete theme stylesheet for a tenant
 */
export function generateThemeStylesheet(tenant: Tenant): string {
  const theme: ThemeConfig = {
    colors: {
      primary: tenant.primaryColor,
      secondary: tenant.secondaryColor,
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      accent: tenant.primaryColor + '20',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    branding: {
      logo: tenant.logoUrl,
      favicon: tenant.faviconUrl,
      name: tenant.name,
      backgroundImage: tenant.backgroundImage,
    },
    borderRadius: '0.5rem',
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
  };

  let css = generateCSSVariables(theme);
  
  // Add custom CSS if configured
  if (tenant.customCSS) {
    css += `\n\n/* Custom CSS for ${tenant.name} */\n${tenant.customCSS}`;
  }
  
  return css;
}

/**
 * Validate a color string (hex format)
 */
export function isValidColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Suggest accessible color pairings
 */
export function suggestAccessibleColors(baseColor: string): {
  primary: string;
  secondary: string;
  text: string;
  background: string;
} {
  const contrast = getContrastColor(baseColor);
  
  return {
    primary: baseColor,
    secondary: lightenColor(baseColor, 20),
    text: contrast === '#000000' ? '#1a1a1a' : '#ffffff',
    background: contrast === '#000000' ? '#ffffff' : '#0a0a0a',
  };
}
