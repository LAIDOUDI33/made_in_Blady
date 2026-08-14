/**
 * Email Templates Index
 * 
 * Central export point for all email templates.
 * 
 * @module lib/email/templates
 */

export { welcomeBuyerTemplate } from './welcome-buyer';
export type { WelcomeBuyerProps } from './welcome-buyer';

export { welcomeSupplierTemplate } from './welcome-supplier';
export type { WelcomeSupplierProps } from './welcome-supplier';

export { emailVerificationTemplate } from './email-verification';
export type { EmailVerificationProps } from './email-verification';

export { passwordResetTemplate } from './password-reset';
export type { PasswordResetProps } from './password-reset';

export { newRFQTemplate } from './new-rfq';
export type { NewRFQProps } from './new-rfq';

export { quotationReceivedTemplate } from './quotation-received';
export type { QuotationReceivedProps } from './quotation-received';

export { orderConfirmedTemplate } from './order-confirmed';
export type { OrderConfirmedProps, OrderItem as OrderConfirmedItem } from './order-confirmed';

export { orderShippedTemplate } from './order-shipped';
export type { OrderShippedProps } from './order-shipped';

export { companyVerificationTemplate } from './company-verification';
export type { CompanyVerificationProps } from './company-verification';

// Base template utilities
export { baseEmailTemplate, emailButton, divider, alertBox, formatDate, formatRelativeTime } from './base';
