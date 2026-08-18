'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Lock,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe2,
  Save,
  ChevronDown,
  ArrowRightLeft,
  Info,
  Smartphone,
  Wallet,
  Building2,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn, formatDZD } from '@/lib/utils';
import {
  stripeConfig,
  currencyInfo,
  paymentMethodConfig,
  getAvailablePaymentMethods,
  formatCurrency as formatStripeCurrency,
  calculateStripeFees,
} from '@/lib/payments/stripe/config';
import type {
  StripePaymentRequest,
  StripePaymentResponse,
  PaymentMethodType,
} from '@/lib/payments/stripe/types';
import { paymentMessages } from '@/lib/payments/stripe/types';

// Make sure to call loadStripe outside of a component's render
const stripePromise = loadStripe(stripeConfig.publishableKey);

// ============================================
// TYPES
// ============================================

interface StripeCardFormProps {
  orderId: string;
  orderNumber?: string;
  amountDZD: number; // Amount in DZD
  customerEmail: string;
  customerName: string;
  onPaymentSuccess?: (result: PaymentResult) => void;
  onPaymentError?: (error: string) => void;
  className?: string;
  locale?: 'fr' | 'ar' | 'en';
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  message?: string;
}

type FormStep = 'details' | 'payment' | 'processing' | 'success' | 'error';

interface ExchangeRateInfo {
  rate: number;
  convertedAmount: number;
  lastUpdated: string;
}

// ============================================
// LOCALIZATION HOOK
// ============================================

function useLocale(locale: 'fr' | 'ar' | 'en' = 'fr') {
  const t = useCallback((key: string): string => {
    const messages = paymentMessages[key];
    if (!messages) return key;
    return messages[locale] || messages['en'] || key;
  }, [locale]);

  return { t, locale };
}

// ============================================
// CARD ELEMENT OPTIONS
// ============================================

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1a1a1a',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#006233', // Algeria green
    },
    invalid: {
      color: '#dc2626',
      ':focus': {
        color: '#dc2626',
      },
    },
    complete: {
      color: '#16a34a',
    },
  },
  classes: {
    focus: 'border-primary ring-ring',
    invalid: 'border-destructive',
    complete: 'border-green-500',
  },
};

// ============================================
// MAIN FORM COMPONENT
// ============================================

export function StripeCardForm({
  orderId,
  orderNumber,
  amountDZD,
  customerEmail,
  customerName,
  onPaymentSuccess,
  onPaymentError,
  className,
  locale = 'fr',
}: StripeCardFormProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [exchangeRateInfo, setExchangeRateInfo] = useState<ExchangeRateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>('');
  
  // Fetch exchange rates when currency changes
  useEffect(() => {
    async function fetchExchangeRate() {
      try {
        const response = await fetch(
          `/api/payments/stripe/exchange-rate?to=${selectedCurrency}&amount=${amountDZD}`
        );
        const data = await response.json();
        
        if (data.success && data.conversion) {
          setExchangeRateInfo({
            rate: data.conversion.rate,
            convertedAmount: data.conversion.convertedAmount,
            lastUpdated: data.conversion.timestamp,
          });
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    }
    
    fetchExchangeRate();
  }, [selectedCurrency, amountDZD]);

  // Create payment intent when user proceeds to payment
  const handleCreatePaymentIntent = useCallback(async () => {
    setIsLoading(true);
    setFormError('');
    
    try {
      const response = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: amountDZD,
          currency: selectedCurrency,
          customerEmail,
          customerName,
          description: `Export Order #${orderNumber || orderId}`,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.transaction?.clientSecret) {
        setClientSecret(data.transaction.clientSecret);
      } else {
        setFormError(data.error || 'Failed to create payment intent');
        if (onPaymentError) onPaymentError(data.error);
      }
    } catch (error) {
      setFormError('Network error. Please try again.');
      if (onPaymentError) onPaymentError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, orderNumber, amountDZD, selectedCurrency, customerEmail, customerName, onPaymentError]);

  // Stripe Elements options
  const options: StripeElementsOptions = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#006233', // Algeria green
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#dc2626',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
      },
    },
  }), [clientSecret]);

  // If we have a client secret, show the payment form
  if (clientSecret) {
    return (
      <div className={cn('w-full', className)}>
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            orderId={orderId}
            amountDZD={amountDZD}
            selectedCurrency={selectedCurrency}
            exchangeRateInfo={exchangeRateInfo}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
            locale={locale}
          />
        </Elements>
      </div>
    );
  }

  // Show initial form with currency selection
  return (
    <Card className={cn('w-full max-w-lg mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Globe2 className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-xl">
          {locale === 'ar' ? 'الدفع الدولي' : locale === 'en' ? 'International Payment' : 'Paiement International'}
        </CardTitle>
        <CardDescription>
          {locale === 'ar' 
            ? 'ادفع بالبطاقات الدولية لطلبات التصدير'
            : locale === 'en'
            ? 'Pay with international cards for export orders'
            : 'Payez avec des cartes internationales pour les commandes d\'exportation'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="rounded-lg bg-muted p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {locale === 'ar' ? 'الطلب' : locale === 'en' ? 'Order' : 'Commande'}
            </span>
            <span className="font-medium">#{orderNumber || orderId}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {locale === 'ar' ? 'المبلغ (د.ج)' : locale === 'en' ? 'Amount (DZD)' : 'Montant (DZD)'}
            </span>
            <span className="font-bold text-lg">{formatDZD(amountDZD)}</span>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency-select" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            {locale === 'ar' 
              ? 'اختر عملة الدفع'
              : locale === 'en'
              ? 'Select payment currency'
              : 'Choisir la devise de paiement'
            }
          </Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger id="currency-select" className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(currencyInfo).map(([code, info]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{info.flag}</span>
                    <span>{code}</span>
                    <span className="text-muted-foreground">- {info.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Converted Amount Preview */}
        {exchangeRateInfo && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {locale === 'ar' 
                    ? 'المبلغ المحول'
                    : locale === 'en'
                    ? 'Converted Amount'
                    : 'Montant Converti'
                  }
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatStripeCurrency(exchangeRateInfo.convertedAmount, selectedCurrency)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  1 DZD = {exchangeRateInfo.rate.toFixed(4)} {selectedCurrency}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fee Breakdown */}
        {exchangeRateInfo && (
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm dark:bg-gray-900">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {locale === 'ar' ? 'المبلغ' : locale === 'en' ? 'Amount' : 'Montant'}
              </span>
              <span>{formatStripeCurrency(exchangeRateInfo.convertedAmount, selectedCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {locale === 'ar' ? 'رسوم المعالجة' : locale === 'en' ? 'Processing Fee' : 'Frais de traitement'}
              </span>
              <span>
                {(() => {
                  const fees = calculateStripeFees(exchangeRateInfo.convertedAmount, selectedCurrency);
                  return formatStripeCurrency(fees.feeAmount, selectedCurrency);
                })()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>
                {locale === 'ar' ? 'الإجمالي' : locale === 'en' ? 'Total' : 'Total'}
              </span>
              <span>
                {(() => {
                  const fees = calculateStripeFees(exchangeRateInfo.convertedAmount, selectedCurrency);
                  return formatStripeCurrency(fees.totalAmount, selectedCurrency);
                })()}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {formError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleCreatePaymentIntent}
          disabled={isLoading || !exchangeRateInfo}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {locale === 'ar' ? 'جارٍ التحميل...' : locale === 'en' ? 'Loading...' : 'Chargement...'}
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {locale === 'ar' 
                ? 'متابعة إلى الدفع الآمن'
                : locale === 'en'
                ? 'Proceed to Secure Payment'
                : 'Continuer vers le paiement sécurisé'
              }
            </>
          )}
        </Button>
      </CardFooter>

      {/* Security Badges */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span>SSL Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-4 w-4" />
            <span>PCI DSS</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span>3D Secure</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// PAYMENT FORM COMPONENT (inside Elements)
// ============================================

interface PaymentFormProps {
  orderId: string;
  amountDZD: number;
  selectedCurrency: string;
  exchangeRateInfo: ExchangeRateInfo | null;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  locale?: 'fr' | 'ar' | 'en';
}

function PaymentForm({
  orderId,
  amountDZD,
  selectedCurrency,
  exchangeRateInfo,
  onSuccess,
  onError,
  locale = 'fr',
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState<PaymentMethodType>('card');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formStep, setFormStep] = useState<FormStep>('payment');

  const { t } = useLocale(locale);

  // Get available payment methods for this currency
  const availableMethods = useMemo(() => {
    return getAvailablePaymentMethods(undefined, selectedCurrency);
  }, [selectedCurrency]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not been properly initialized.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Confirm the payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success?orderId=${orderId}`,
        },
      });

      if (confirmError) {
        setErrorMessage(confirmError.message || 'Payment failed');
        if (onError) onError(confirmError.message);
      } else {
        // Payment initiated successfully - redirect will happen automatically
        setFormStep('processing');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      if (onError) onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render based on step
  switch (formStep) {
    case 'processing':
      return <ProcessingState locale={locale} />;
    
    case 'success':
      return <SuccessState locale={locale} />;
    
    default:
      return (
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              {t('payment.title')}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'أكمل تفاصيل الدفع الخاصة بك'
                : locale === 'en'
                ? 'Complete your payment details'
                : 'Complétez vos coordonnées de paiement'
              }
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>{t('card.number')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(availableMethods).slice(0, 6).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMethodType(key as PaymentMethodType)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent',
                        selectedMethodType === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      )}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-sm font-medium truncate">{config.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Element */}
              {(selectedMethodType === 'card' || selectedMethodType === 'apple_pay' || selectedMethodType === 'google_pay') && (
                <div className="space-y-2">
                  <Label>{t('card.number')}</Label>
                  <div className="rounded-lg border p-3 bg-white dark:bg-gray-950">
                    <CardElement options={cardElementOptions} />
                  </div>
                </div>
              )}

              {/* Alternative Payment Method Info */}
              {!['card', 'apple_pay', 'google_pay'].includes(selectedMethodType) && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex items-start gap-3">
                    {getPaymentMethodIcon(selectedMethodType)}
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {availableMethods[selectedMethodType]?.name || selectedMethodType}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {locale === 'ar'
                          ? 'سيتم توجيهك لإتمام الدفع عبر بوابة الدفع هذه.'
                          : locale === 'en'
                          ? 'You will be redirected to complete your payment through this payment gateway.'
                          : 'Vous serez redirigé pour compléter votre paiement via cette passerelle de paiement.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {exchangeRateInfo && (
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('currency.converted')}</span>
                    <span className="font-semibold">
                      {formatStripeCurrency(exchangeRateInfo.convertedAmount, selectedCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('exchange.rate')}</span>
                    <span>1 DZD = {exchangeRateInfo.rate.toFixed(4)} {selectedCurrency}</span>
                  </div>
                </div>
              )}

              {/* Save Payment Method */}
              <div className="flex items-start gap-3 space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="save-card"
                  checked={savePaymentMethod}
                  onCheckedChange={(checked) => setSavePaymentMethod(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="save-card"
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  {t('card.save')}
                </Label>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('payment.processing')}
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {locale === 'ar'
                      ? `ادفع ${formatStripeCurrency(exchangeRateInfo?.convertedAmount || 0, selectedCurrency)}`
                      : locale === 'en'
                      ? `Pay ${formatStripeCurrency(exchangeRateInfo?.convertedAmount || 0, selectedCurrency)}`
                      : `Payer ${formatStripeCurrency(exchangeRateInfo?.convertedAmount || 0, selectedCurrency)}`
                    }
                  </>
                )}
              </Button>

              {/* Security Info */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  256-bit SSL
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  PCI DSS Compliant
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CreditCard className="h-3 w-3" />
                  3D Secure
                </Badge>
              </div>
            </CardFooter>
          </form>
        </Card>
      );
  }
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ProcessingState({ locale }: { locale: 'fr' | 'ar' | 'en' }) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-primary/20" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">
            {locale === 'ar' ? 'جارٍ معالجة الدفع' : locale === 'en' ? 'Processing Payment' : 'Traitement du Paiement'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {locale === 'ar'
              ? 'يرجى الانتظار بينما نؤكد دفعتك...'
              : locale === 'en'
              ? 'Please wait while we confirm your payment...'
              : 'Veuillez patienter pendant que nous confirmons votre paiement...'
            }
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {locale === 'ar'
            ? 'لا تغلق هذه النافذة'
            : locale === 'en'
            ? 'Do not close this window'
            : 'Ne fermez pas cette fenêtre'
          }
        </p>
      </CardContent>
    </Card>
  );
}

function SuccessState({ locale }: { locale: 'fr' | 'ar' | 'en' }) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-green-800">
            {t('payment.success', locale)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {locale === 'ar'
              ? 'تم تأكيد دفعتك بنجاح!'
              : locale === 'en'
              ? 'Your payment has been confirmed successfully!'
              : 'Votre paiement a été confirmé avec succès!'
            }
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/orders'}>
          {locale === 'ar'
            ? 'عرض الطلبات'
            : locale === 'en'
            ? 'View Orders'
            : 'Voir les commandes'
          }
        </Button>
      </CardContent>
    </Card>
  );
}

function getPaymentMethodIcon(type: PaymentMethodType) {
  const icons: Record<PaymentMethodType, React.ReactNode> = {
    card: <CreditCard className="h-5 w-5 text-blue-600 shrink-0" />,
    apple_pay: <Smartphone className="h-5 w-5 text-gray-800 shrink-0" />,
    google_pay: <Wallet className="h-5 w-5 text-white shrink-0" style={{ background: 'linear-gradient(to right, #4285F4, #34A853, #FBBC05, #EA4335)', padding: '4px', borderRadius: '4px' }} />,
    ideal: <Building2 className="h-5 w-5 text-orange-500 shrink-0" />,
    sepa_debit: <Landmark className="h-5 w-5 text-blue-700 shrink-0" />,
    bancontact: <CreditCard className="h-5 w-5 text-blue-500 shrink-0" />,
    sofort: <Building2 className="h-5 w-5 text-pink-500 shrink-0" />,
    giropay: <Building2 className="h-5 w-5 text-pink-600 shrink-0" />,
    eps: <Building2 className="h-5 w-5 text-green-600 shrink-0" />,
    p24: <Building2 className="h-5 w-5 text-red-600 shrink-0" />,
    alipay: <Wallet className="h-5 w-5 text-blue-500 shrink-0" />,
    link: <Wallet className="h-5 w-5 text-purple-600 shrink-0" />,
  };
  
  return icons[type] || <CreditCard className="h-5 w-5 shrink-0" />;
}

function t(key: string, locale: 'fr' | 'ar' | 'en'): string {
  const messages = paymentMessages[key];
  if (!messages) return key;
  return messages[locale] || messages['en'] || key;
}

// Export the component and sub-components
export default StripeCardForm;

// Export utility components for reuse
export { ProcessingState, SuccessState };
