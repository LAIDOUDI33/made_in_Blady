/**
 * Email Templates Index
 * 
 * Central export point for all email templates.
 * 
 * @module lib/email/templates
 */

// Core Templates
export { welcomeBuyerTemplate } from './welcome-buyer';
export type { WelcomeBuyerProps } from './welcome-buyer';

export { welcomeSupplierTemplate } from './welcome-supplier';
export type { WelcomeSupplierProps } from './welcome-supplier';

export { emailVerificationTemplate } from './email-verification';
export type { EmailVerificationProps } from './email-verification';

export { passwordResetTemplate } from './password-reset';
export type { PasswordResetProps } from './password-reset';

// RFQ & Order Templates
export { newRFQTemplate } from './new-rfq';
export type { NewRFQProps } from './new-rfq';

export { quotationReceivedTemplate } from './quotation-received';
export type { QuotationReceivedProps } from './quotation-received';

export { orderConfirmedTemplate } from './order-confirmed';
export type { OrderConfirmedProps, OrderItem as OrderConfirmedItem } from './order-confirmed';

export { orderShippedTemplate } from './order-shipped';
export type { OrderShippedProps } from './order-shipped';

// Verification Templates (Phase 7E)
export { companyVerificationTemplate } from './company-verification';
export type { CompanyVerificationProps } from './company-verification';

export { verificationRequestReceivedTemplate } from './verification-request-received';
export type { VerificationRequestReceivedProps } from './verification-request-received';

export { verificationApprovedTemplate } from './verification-approved';
export type { VerificationApprovedProps } from './verification-approved';

export { verificationRejectedTemplate } from './verification-rejected';
export type { VerificationRejectedProps } from './verification-rejected';

// Escrow & Dispute Templates (Phase 7E)
export { escrowFundedTemplate } from './escrow-funded';
export type { EscrowFundedProps } from './escrow-funded';

export { escrowReleasedTemplate } from './escrow-released';
export type { EscrowReleasedProps } from './escrow-released';

export { escrowRefundedTemplate } from './escrow-refunded';
export type { EscrowRefundedProps } from './escrow-refunded';

export { disputeOpenedTemplate } from './dispute-opened';
export type { DisputeOpenedProps } from './dispute-opened';

export { disputeResolvedTemplate } from './dispute-resolved';
export type { DisputeResolvedProps } from './dispute-resolved';

// Inspection Templates (Phase 7E)
export { inspectionBookedTemplate } from './inspection-booked';
export type { InspectionBookedProps } from './inspection-booked';

export { inspectionScheduledTemplate } from './inspection-scheduled';
export type { InspectionScheduledProps } from './inspection-scheduled';

export { inspectionCompletedTemplate } from './inspection-completed';
export type { InspectionCompletedProps } from './inspection-completed';

export { inspectionReportTemplate } from './inspection-report';
export type { InspectionReportProps } from './inspection-report';

// Exhibition Templates (Phase 7E)
export { exhibitionRegistrationConfirmedTemplate } from './exhibition-registration-confirmed';
export type { ExhibitionRegistrationConfirmedProps } from './exhibition-registration-confirmed';

export { exhibitionReminderTemplate } from './exhibition-reminder';
export type { ExhibitionReminderProps } from './exhibition-reminder';

export { boothConfirmedTemplate } from './booth-confirmed';
export type { BoothConfirmedProps } from './booth-confirmed';

// Shipping Templates (Phase 7E)
export { shipmentCreatedTemplate } from './shipment-created';
export type { ShipmentCreatedProps } from './shipment-created';

export { shipmentInTransitTemplate } from './shipment-in-transit';
export type { ShipmentInTransitProps } from './shipment-in-transit';

export { shipmentDeliveredTemplate } from './shipment-delivered';
export type { ShipmentDeliveredProps } from './shipment-delivered';

export { deliveryAttemptedTemplate } from './delivery-attempted';
export type { DeliveryAttemptedProps } from './delivery-attempted';

// Base template utilities
export { baseEmailTemplate, emailButton, divider, alertBox, formatDate, formatRelativeTime } from './base';
