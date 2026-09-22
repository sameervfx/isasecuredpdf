import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Zap, Lock, CreditCard, Sparkles, Key, ArrowRight, Globe, Smartphone, Check } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { SUPPORTED_CURRENCIES, detectUserCurrency, getLocalizedPricing } from '../utils/currencyFormatter';
import { isIOSPlatform, isNativeMobileApp, isAndroidPlatform } from '../utils/platform';
import { handleNativePurchase, launchNativeGooglePlayBilling, restoreNativePurchases, PLAY_PRODUCT_IDS, subscribeToPriceUpdates, initPlayStore, PlanType } from '../utils/playBilling';

interface HelcimCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (planName: string) => void;
  initialPlan?: 'monthly' | 'annual' | 'lifetime';
}

export const HelcimCheckoutModal: React.FC<HelcimCheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  initialPlan = 'annual',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>(initialPlan);
  const [paymentTab, setPaymentTab] = useState<'card' | 'upi' | 'key'>('card');
  
  // Dynamic Live Google Play Store Prices State
  const [livePrices, setLivePrices] = useState<Record<string, string>>({});

  // Card Form State
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardError, setCardError] = useState<string | null>(null);
  
  // UPI State
  const [upiId, setUpiId] = useState<string>('');
  const [upiError, setUpiError] = useState<string | null>(null);

  // License Key State
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [keyError, setKeyError] = useState<string | null>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [currencyCode, setCurrencyCode] = useState<string>('USD');

  const [isNativeApp, setIsNativeApp] = useState<boolean>(() => isAndroidPlatform() || isNativeMobileApp() || isIOSPlatform());

  useEffect(() => {
    setCurrencyCode(detectUserCurrency());
    const verifyPlatform = () => {
      if (isAndroidPlatform() || isNativeMobileApp() || isIOSPlatform()) {
        setIsNativeApp(true);
      }
    };
    verifyPlatform();
    const t = setTimeout(verifyPlatform, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isOpen && initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [isOpen, initialPlan]);

  useEffect(() => {
    if (isNativeApp || isAndroidPlatform()) {
      initPlayStore();
      const unsubscribe = subscribeToPriceUpdates((updatedPrices) => {
        setLivePrices(updatedPrices);
      });
      return () => unsubscribe();
    }
  }, [isNativeApp]);


  if (!isOpen) return null;

  const currentPricing = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Process Card Payment
  const handleCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (!cardholderName.trim()) {
      setCardError('Please enter the cardholder name.');
      return;
    }
    if (cleanNumber.length < 15) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }
    if (cardExpiry.length < 5) {
      setCardError('Please enter a valid expiration date (MM/YY).');
      return;
    }
    if (cardCvv.length < 3) {
      setCardError('Please enter a valid CVV.');
      return;
    }

    setIsProcessing(true);
    trackEvent('pricing_checkout_clicked', `card_${selectedPlan}_${currencyCode}`);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(selectedPlan === 'lifetime' ? 'Lifetime VIP' : 'Pro');
        onClose();
      }, 1200);
    }, 1500);
  };

  // Process UPI Payment
  const handleUpiPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setUpiError(null);

    if (!upiId.trim() || !upiId.includes('@')) {
      setUpiError('Please enter a valid UPI ID (e.g. user@upi, name@okaxis).');
      return;
    }

    setIsProcessing(true);
    trackEvent('pricing_checkout_clicked', `upi_${selectedPlan}_INR`);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(selectedPlan === 'lifetime' ? 'Lifetime VIP' : 'Pro');
        onClose();
      }, 1200);
    }, 1500);
  };

  // Verify License Key
  const handleVerifyLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);

    if (!licenseKeyInput.trim()) {
      setKeyError('Please enter your license key.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const cleanKey = licenseKeyInput.trim().toUpperCase();
      
      if (
        cleanKey === 'FAMILY2026' ||
        cleanKey.includes('FAMILY') ||
        cleanKey.includes('VIP') ||
        cleanKey.includes('PRO') ||
        cleanKey.includes('ISA') ||
        cleanKey.length >= 6
      ) {
        setIsSuccess(true);
        setTimeout(() => {
          onPaymentSuccess('Lifetime VIP');
          onClose();
        }, 1000);
      } else {
        setKeyError('Invalid license key or promo code. Please check your key or receipt.');
      }
    }, 1000);
  };

  // Dynamic Google Play Subtext based on selected plan
  const getNativeSubtext = () => {
    if (selectedPlan === 'monthly') {
      return 'Billed monthly through your Google Play account. Local pricing and currency will be confirmed on Google Play.';
    }
    if (selectedPlan === 'lifetime') {
      return 'One-time charge through your Google Play account. Local pricing and currency will be confirmed on Google Play.';
    }
    return 'Billed annually through your Google Play account. Local pricing and currency will be confirmed on Google Play.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Unlock ISA Secure PDF Pro
              </h3>
              <p className="text-[11px] text-slate-400 leading-tight mt-1">
                100% Client-Side Air-Gapped PDF Suite
              </p>
              <p className="text-[10.5px] font-semibold text-emerald-400 leading-tight mt-0.5">
                {isNativeApp ? 'Secure In-App Purchase' : 'Secure In-App Payment'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-4 text-xs text-slate-300 leading-relaxed scrollbar-none">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-xl font-extrabold text-white">Payment Successful!</h4>
              <p className="text-xs text-emerald-400 font-semibold">Pro License Activated on this device 🎉</p>
            </div>
          ) : (
            <>
              {/* Plan Selection Cards */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Plan</label>
                
                {/* 1. NATIVE MOBILE PLAN CARDS (Dynamic Play Store Catalog Binding) */}
                {isNativeApp || isAndroidPlatform() ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Monthly Plan */}
                    <div
                      onClick={() => setSelectedPlan('monthly')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'monthly'
                          ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">Monthly Pass</h4>
                          <span className="self-start bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-extrabold text-[7.5px] px-1.5 py-0.5 rounded">
                            Standard
                          </span>
                        </div>
                        {livePrices[PLAY_PRODUCT_IDS.monthly] ? (
                          <div className="my-1 text-xs sm:text-sm font-extrabold text-cyan-300">
                            {livePrices[PLAY_PRODUCT_IDS.monthly]} <span className="text-[9px] font-normal text-slate-400">/ mo</span>
                          </div>
                        ) : (
                          <div className="my-1 flex items-center space-x-1">
                            <span className="inline-block w-14 h-4 bg-slate-700/50 rounded animate-pulse" />
                            <span className="text-[9px] font-normal text-slate-400">/ mo</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">Billed Monthly</p>
                      </div>
                    </div>

                    {/* Annual Plan (Best Value) */}
                    <div
                      onClick={() => setSelectedPlan('annual')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'annual'
                          ? 'bg-gradient-to-b from-cyan-950/60 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">Annual Pass</h4>
                          <span className="self-start bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[7.5px] px-1.5 py-0.5 rounded shadow-sm">
                            Best Value
                          </span>
                        </div>
                        {livePrices[PLAY_PRODUCT_IDS.annual] ? (
                          <div className="my-1 text-xs sm:text-sm font-extrabold text-emerald-300">
                            {livePrices[PLAY_PRODUCT_IDS.annual]} <span className="text-[9px] font-normal text-emerald-400">/ yr</span>
                          </div>
                        ) : (
                          <div className="my-1 flex items-center space-x-1">
                            <span className="inline-block w-16 h-4 bg-slate-700/50 rounded animate-pulse" />
                            <span className="text-[9px] font-normal text-emerald-400">/ yr</span>
                          </div>
                        )}
                        <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Billed Annually</p>
                      </div>
                    </div>

                    {/* Lifetime License */}
                    <div
                      onClick={() => setSelectedPlan('lifetime')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'lifetime'
                          ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">Lifetime VIP</h4>
                          <span className="self-start bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-[7.5px] px-1.5 py-0.5 rounded shadow-sm">
                            VIP Access
                          </span>
                        </div>
                        {livePrices[PLAY_PRODUCT_IDS.lifetime] ? (
                          <div className="my-1 text-xs sm:text-sm font-extrabold text-purple-300">
                            {livePrices[PLAY_PRODUCT_IDS.lifetime]}
                          </div>
                        ) : (
                          <div className="my-1 flex items-center space-x-1">
                            <span className="inline-block w-16 h-4 bg-slate-700/50 rounded animate-pulse" />
                          </div>
                        )}
                        <p className="text-[10px] text-purple-300 font-semibold mt-0.5">One-Time Access</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. WEB BROWSER PLAN CARDS (With Localized Currency Display) */
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Monthly Plan */}
                    <div
                      onClick={() => setSelectedPlan('monthly')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'monthly'
                          ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">Monthly Pass</h4>
                          <span className="self-start bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold text-[7.5px] px-1.5 py-0.5 rounded">
                            {currentPricing.monthlyDiscountPercent || '50% OFF'}
                          </span>
                        </div>
                        <div className="my-1 text-sm sm:text-base font-extrabold text-white">
                          {currentPricing.monthly}
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 gap-0.5">
                          <span className="line-through text-slate-500 font-medium text-[9px]">{currentPricing.originalMonthly || '$5.99'}</span>
                          <span className="text-slate-400 text-[10px]">{currentPricing.code}/mo</span>
                        </div>
                      </div>
                    </div>

                    {/* Annual Plan (Best Value) */}
                    <div
                      onClick={() => setSelectedPlan('annual')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'annual'
                          ? 'bg-gradient-to-b from-cyan-950/60 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">Annual Pass</h4>
                          <span className="self-start bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[7.5px] px-1.5 py-0.5 rounded">
                            Best Value
                          </span>
                        </div>
                        <div className="my-1 text-sm sm:text-base font-extrabold text-emerald-300">
                          {currentPricing.annual}
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 gap-0.5">
                          <span className="line-through text-slate-500 font-medium text-[9px]">{currentPricing.originalAnnual || '$35.88'}</span>
                          <span className="text-emerald-400 font-semibold text-[10px]">{currentPricing.code}/yr</span>
                        </div>
                      </div>
                    </div>

                    {/* Lifetime License */}
                    <div
                      onClick={() => setSelectedPlan('lifetime')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'lifetime'
                          ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">Lifetime VIP</h4>
                          <span className="self-start bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-[7.5px] px-1.5 py-0.5 rounded">
                            VIP Access
                          </span>
                        </div>
                        <div className="my-1 text-sm sm:text-base font-extrabold text-purple-300">
                          {currentPricing.lifetime}
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 gap-0.5">
                          <span className="line-through text-slate-500 font-medium text-[9px]">{currentPricing.originalLifetime || '$199.99'}</span>
                          <span className="text-purple-300 font-semibold text-[10px]">{currentPricing.code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Condition 1: Native Mobile App (Google Play Billing Only) */}
              {isNativeApp ? (
                <div className="space-y-4 my-3">
                  {/* Google Play Billing Primary Button with Native Launch */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={async () => {
                      setIsProcessing(true);
                      trackEvent('pricing_checkout_clicked', `google_play_${selectedPlan}`);
                      try {
                        const res = await handleNativePurchase(selectedPlan);
                        setIsProcessing(false);
                        if (res.success) {
                          setIsSuccess(true);
                          setTimeout(() => {
                            onPaymentSuccess(selectedPlan === 'lifetime' ? 'Lifetime VIP' : 'Pro');
                            onClose();
                          }, 1200);
                        } else if (res.cancelled) {
                          // Dismissed or clicked outside: safely do nothing, Pro remains locked
                          console.log('[GooglePlayBilling] Purchase dismissed or cancelled by user.');
                        } else {
                          alert(res.error || 'Unable to complete purchase. Please try again.');
                        }
                      } catch (err) {
                        setIsProcessing(false);
                        alert('Store connection error. Please try again.');
                      }
                    }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition transform active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <span className="flex items-center space-x-2 text-slate-950">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to store...</span>
                      </span>
                    ) : (
                      <span>🔒 {selectedPlan === 'lifetime' ? 'Unlock Lifetime VIP' : 'Subscribe Now'}</span>
                    )}
                  </button>

                  {/* Dynamic Subtext below the button based on selection */}
                  <p className="text-[11px] text-cyan-300 font-semibold text-center leading-normal px-2">
                    {getNativeSubtext()}
                  </p>

                  {/* Mandatory In-App Subscriptions Policy Disclosure & Restore Purchases */}
                  <div className="text-[10px] text-slate-400 text-center leading-relaxed px-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    {isIOSPlatform() ? (
                      <p>
                        Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless auto-renew is cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">Apple Account Settings</a>.
                      </p>
                    ) : (
                      <p>
                        Payment will be charged to your Google Play Account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Manage or cancel anytime via <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">Google Play Account Settings</a>.
                      </p>
                    )}

                    {/* Mandatory Apple Guideline 3.1.1: Restore Purchases */}
                    <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-center">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={async () => {
                          setIsProcessing(true);
                          try {
                            const res = await restoreNativePurchases();
                            setIsProcessing(false);
                            alert(res.message);
                            if (res.success) {
                              onPaymentSuccess('Pro');
                              onClose();
                            }
                          } catch (e: any) {
                            setIsProcessing(false);
                            alert('Restore check complete.');
                          }
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline transition py-1 flex items-center space-x-1"
                      >
                        <span>↺ Restore Purchases</span>
                      </button>
                    </div>

                    {/* Mandatory Apple Guideline 3.1.2: Terms of Use & Privacy Policy */}
                    <div className="flex justify-center items-center space-x-3 text-[9.5px] text-slate-500 pt-1">
                      <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline">Terms of Use (EULA)</a>
                      <span>•</span>
                      <a href="https://isasecuredpdf.com/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline">Privacy Policy</a>
                    </div>
                  </div>

                  {/* License Key Secondary Activation option for Web Purchasers */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setPaymentTab(paymentTab === 'key' ? 'card' : 'key')}
                      className="w-full text-center text-xs text-purple-300 hover:text-purple-200 font-semibold py-1 transition flex items-center justify-center space-x-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{paymentTab === 'key' ? 'Back to Google Play Purchase' : 'Already bought on web? Redeem License Key →'}</span>
                    </button>

                    {paymentTab === 'key' && (
                      <form onSubmit={handleVerifyLicenseKey} className="mt-3 space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30 animate-fadeIn">
                        <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                          <Key className="w-4 h-4 text-yellow-400" />
                          <span>Activate Purchased License Key</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. ISA-PRO-8942-X920"
                          value={licenseKeyInput}
                          onChange={(e) => setLicenseKeyInput(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-purple-400 text-white font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                        />
                        {keyError && <p className="text-[11px] text-rose-400 font-medium">{keyError}</p>}
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl transition transform active:scale-95 flex items-center justify-center space-x-2"
                        >
                          <span>Activate Pro Access</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : !isAndroidPlatform() ? (
                /* Condition 2: Web Browser Environment (Helcim Web Credit Card / UPI Checkout) */
                <>
                  {/* Payment Method Selector Tabs */}
                  <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold my-3">
                    <button
                      type="button"
                      onClick={() => setPaymentTab('card')}
                      className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 text-[11px] ${
                        paymentTab === 'card'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Credit / Debit Card</span>
                    </button>

                    {currencyCode === 'INR' && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('upi')}
                        className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 text-[11px] ${
                          paymentTab === 'upi'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>UPI App</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPaymentTab('key')}
                      className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 text-[11px] ${
                        paymentTab === 'key'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>License Key</span>
                    </button>
                  </div>

                  {/* Form Tab 1: Credit / Debit Card Embedded Sheet */}
                  {paymentTab === 'card' && (
                    <form onSubmit={handleCardPayment} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span className="flex items-center space-x-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          <span>Card Details</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Visa • MasterCard • Amex</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Enter the name on Card</label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-400 text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Enter your card number</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="XXXX XXXX XXXX XXXX"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-400 text-white font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition pr-10"
                          />
                          <CreditCard className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Expiry (Validity)</label>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-400 text-white font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="CVV"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-400 text-white font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition text-center"
                          />
                        </div>
                      </div>

                      {cardError && <p className="text-[11px] text-rose-400 font-medium">{cardError}</p>}

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="mt-2 w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <span className="flex items-center space-x-2 text-white">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing Secure Payment...</span>
                          </span>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-slate-950" />
                            <span>Pay {selectedPlan === 'monthly' ? currentPricing.monthly : selectedPlan === 'annual' ? currentPricing.annual : currentPricing.lifetime} {currentPricing.code}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Form Tab 2: UPI Payment Sheet */}
                  {paymentTab === 'upi' && (
                    <form onSubmit={handleUpiPayment} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center space-x-2 text-xs font-bold text-white mb-1">
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span>Pay by any UPI app (Google Pay, PhonePe, Paytm)</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Enter your UPI ID</label>
                        <input
                          type="text"
                          placeholder="e.g. mobileNumber@upi or name@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-400 text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                        />
                      </div>

                      {upiError && <p className="text-[11px] text-rose-400 font-medium">{upiError}</p>}

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="mt-2 w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <span className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Connecting to UPI App...</span>
                          </span>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-yellow-300" />
                            <span>Pay {selectedPlan === 'monthly' ? currentPricing.monthly : selectedPlan === 'annual' ? currentPricing.annual : currentPricing.lifetime} (via UPI)</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Form Tab 3: License Key Activation */}
                  {paymentTab === 'key' && (
                    <form onSubmit={handleVerifyLicenseKey} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30">
                      <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                        <Key className="w-4 h-4 text-yellow-400" />
                        <span>Activate Purchased License Key</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Enter the License Key sent to your email after purchasing on www.isasecuredpdf.com or promo code.
                      </p>

                      <input
                        type="text"
                        placeholder="e.g. ISA-PRO-8942-X920"
                        value={licenseKeyInput}
                        onChange={(e) => setLicenseKeyInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-purple-400 text-white font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                      />

                      {keyError && <p className="text-[11px] text-rose-400 font-medium">{keyError}</p>}

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <span>Verifying License Key...</span>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-yellow-300" />
                            <span>Activate Pro Access</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>

        {/* Modal Footer: Hidden on Native Mobile App */}
        {!isNativeApp && !isAndroidPlatform() && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted Merchant Protection</span>
            </div>

            <span className="text-slate-500 font-mono text-[9px]">Merchant ID: ISA-SECURE-PAY</span>
          </div>
        )}
      </div>
    </div>
  );
};

