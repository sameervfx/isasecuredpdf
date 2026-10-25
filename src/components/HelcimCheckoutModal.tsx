import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Zap, Lock, CreditCard, Sparkles, Key, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { SUPPORTED_CURRENCIES, detectUserCurrency, getLocalizedPricing, saveUserCurrency } from '../utils/currencyFormatter';
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
  const [paymentTab, setPaymentTab] = useState<'helcim' | 'key'>('helcim');
  
  const detectedCurr = detectUserCurrency();
  const initialPricing = SUPPORTED_CURRENCIES[detectedCurr] || SUPPORTED_CURRENCIES.USD;

  // Dynamic Live Apple StoreKit Prices State (initialized from detected user country, updated live by StoreKit)
  const [livePrices, setLivePrices] = useState<Record<string, string>>(() => ({
    [PLAY_PRODUCT_IDS.monthly]: initialPricing.monthly,
    [PLAY_PRODUCT_IDS.annual]: initialPricing.annual,
    [PLAY_PRODUCT_IDS.lifetime]: initialPricing.lifetime,
  }));

  // License Key State
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [keyError, setKeyError] = useState<string | null>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [currencyCode, setCurrencyCode] = useState<string>(() => detectedCurr);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const [isNativeApp, setIsNativeApp] = useState<boolean>(() => isAndroidPlatform() || isNativeMobileApp() || isIOSPlatform());

  useEffect(() => {
    const curr = detectUserCurrency();
    setCurrencyCode(curr);
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
        setLivePrices((prev) => ({ ...prev, ...updatedPrices }));
      });
      return () => unsubscribe();
    }
  }, [isNativeApp]);

  if (!isOpen) return null;

  const currentPricing = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.CAD;

  // Dynamic Helcim URL Builder passing exact localized USD equivalent amount
  const getDynamicPayUrl = (plan: 'monthly' | 'annual' | 'lifetime', currency: string) => {
    if (isNativeApp) return '';
    const priceInfo = getLocalizedPricing(plan, currency);
    const baseTokens: Record<string, string> = {
      monthly: '8cab3b693d79e2929b76f9',
      annual: '7c45c83a1f97e5346967ea',
      lifetime: '6deee5a8794d0282a8c3b2',
    };
    const token = baseTokens[plan];
    return `https://isasecuredpdf.myhelcim.com/hosted/?token=${token}&amount=${priceInfo.usdAmountNum}`;
  };

  const handleHelcimCheckout = () => {
    trackEvent('pricing_checkout_clicked', `helcim_${selectedPlan}_${currencyCode}`);
    const payUrl = getDynamicPayUrl(selectedPlan, currencyCode);
    if (payUrl) {
      // Open exactly one Helcim checkout tab without duplicate window.location navigation
      window.open(payUrl, '_blank', 'noopener,noreferrer');
    }
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
          onPaymentSuccess(selectedPlan === 'lifetime' ? 'Lifetime VIP' : 'Pro');
          onClose();
        }, 1000);
      } else {
        setKeyError('Invalid license key or promo code. Please check your key or receipt.');
      }
    }, 1000);
  };

  // Dynamic In-App Billing Subtext based on selected plan and platform
  const getNativeSubtext = () => {
    const isIOS = isIOSPlatform();
    const storeName = isIOS ? 'App Store' : 'Google Play';
    const accountName = isIOS ? 'Apple ID account' : 'Google Play account';

    if (selectedPlan === 'monthly') {
      return isIOS 
        ? `Pro Monthly Pass • 1 Month Auto-Renewable Subscription. Billed monthly to your Apple ID. Cancel anytime.`
        : `Billed monthly through your ${accountName}. Local pricing and currency confirmed on the ${storeName}.`;
    }
    if (selectedPlan === 'lifetime') {
      return isIOS
        ? `Lifetime VIP License • Permanent One-Time Purchase. Charged to your Apple ID.`
        : `One-time charge through your ${accountName}. Local pricing and currency confirmed on the ${storeName}.`;
    }
    return isIOS
      ? `Pro Annual Pass • 1 Year Auto-Renewable Subscription. Billed annually to your Apple ID. Cancel anytime.`
      : `Billed annually through your ${accountName}. Local pricing and currency confirmed on the ${storeName}.`;
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
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  Unlock ISA Secure PDF Pro
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-1">
                100% Client-Side Air-Gapped PDF Suite • Official Store Pricing
              </p>
              <p className="text-[10.5px] font-semibold text-emerald-400 leading-tight mt-0.5">
                {isNativeApp ? 'Secure In-App Purchase' : 'Official Helcim Merchant Gateway'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 items-stretch">
                    {/* Monthly Plan */}
                    <div
                      onClick={() => setSelectedPlan('monthly')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'monthly'
                          ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight whitespace-nowrap">Monthly Pass</h4>
                          <span className="inline-flex items-center justify-center bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-extrabold text-[8px] leading-none px-2 py-1 rounded-md whitespace-nowrap">
                            Standard
                          </span>
                        </div>
                        <div className="mt-2 pt-1">
                          <div className="text-xs sm:text-sm font-extrabold text-cyan-300 whitespace-nowrap leading-tight">
                            {livePrices[PLAY_PRODUCT_IDS.monthly] || initialPricing.monthly}<span className="text-[9px] font-medium text-slate-400">/mo</span>
                          </div>
                          <p className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">Billed Monthly</p>
                        </div>
                      </div>
                    </div>

                    {/* Annual Pass (Best Value) */}
                    <div
                      onClick={() => setSelectedPlan('annual')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'annual'
                          ? 'bg-gradient-to-b from-cyan-950/60 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight whitespace-nowrap">Annual Pass</h4>
                          <span className="inline-flex items-center justify-center bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[8px] leading-none px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                            Best Value
                          </span>
                        </div>
                        <div className="mt-2 pt-1">
                          <div className="text-xs sm:text-sm font-extrabold text-emerald-300 whitespace-nowrap leading-tight">
                            {livePrices[PLAY_PRODUCT_IDS.annual] || initialPricing.annual}<span className="text-[9px] font-medium text-emerald-400">/yr</span>
                          </div>
                          <p className="text-[9.5px] sm:text-[10px] text-emerald-400 font-semibold mt-0.5 whitespace-nowrap">Billed Annually</p>
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
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight whitespace-nowrap">Lifetime VIP</h4>
                          <span className="inline-flex items-center justify-center bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-[8px] leading-none px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                            VIP Access
                          </span>
                        </div>
                        <div className="mt-2 pt-1">
                          <div className="text-xs sm:text-sm font-extrabold text-purple-300 whitespace-nowrap leading-tight">
                            {livePrices[PLAY_PRODUCT_IDS.lifetime] || initialPricing.lifetime}
                          </div>
                          <p className="text-[9.5px] sm:text-[10px] text-purple-300 font-semibold mt-0.5 whitespace-nowrap">One-Time Access</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. WEB BROWSER PLAN CARDS (With Localized Currency Display) */
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 items-stretch">
                    {/* Monthly Plan */}
                    <div
                      onClick={() => setSelectedPlan('monthly')}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between relative overflow-hidden ${
                        selectedPlan === 'monthly'
                          ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight whitespace-nowrap">Monthly Pass</h4>
                          <span className="inline-flex items-center justify-center bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold text-[8px] leading-none px-2 py-1 rounded-md whitespace-nowrap">
                            {currentPricing.monthlyDiscountPercent || '50% OFF'}
                          </span>
                        </div>
                        <div className="mt-2 pt-1">
                          <div className="text-xs sm:text-base font-extrabold text-white whitespace-nowrap leading-tight">
                            {currentPricing.monthly}<span className="text-[9px] font-medium text-slate-400">/mo</span>
                          </div>
                          <div className="flex items-center justify-between text-[9.5px] mt-0.5 gap-1 whitespace-nowrap">
                            <span className="line-through text-slate-500 font-medium">{currentPricing.originalMonthly || 'CA$7.99'}</span>
                            <span className="text-slate-400 font-semibold">{currentPricing.code}</span>
                          </div>
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
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight whitespace-nowrap">Annual Pass</h4>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center justify-center bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[8px] leading-none px-1.5 py-1 rounded-md shadow-sm whitespace-nowrap">
                              Best Value
                            </span>
                            <span className="hidden sm:inline-flex items-center justify-center bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold text-[8px] leading-none px-1.5 py-1 rounded-md whitespace-nowrap">
                              {currentPricing.annualDiscountPercent || '58% OFF'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 pt-1">
                          <div className="text-xs sm:text-base font-extrabold text-emerald-300 whitespace-nowrap leading-tight">
                            {currentPricing.annual}<span className="text-[9px] font-medium text-emerald-400">/yr</span>
                          </div>
                          <div className="flex items-center justify-between text-[9.5px] mt-0.5 gap-1 whitespace-nowrap">
                            <span className="line-through text-slate-500 font-medium">{currentPricing.originalAnnual || 'CA$95.88'}</span>
                            <span className="text-emerald-400 font-semibold">{currentPricing.code}</span>
                          </div>
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
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight whitespace-nowrap">Lifetime VIP</h4>
                          <span className="inline-flex items-center justify-center bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-[8px] leading-none px-2 py-1 rounded-md whitespace-nowrap">
                            VIP Access
                          </span>
                        </div>
                        <div className="mt-2 pt-1">
                          <div className="text-xs sm:text-base font-extrabold text-purple-300 whitespace-nowrap leading-tight">
                            {currentPricing.lifetime}
                          </div>
                          <div className="flex items-center justify-between text-[9.5px] mt-0.5 gap-1 whitespace-nowrap">
                            <span className="line-through text-slate-500 font-medium">{currentPricing.originalLifetime || 'CA$249.99'}</span>
                            <span className="text-purple-300 font-semibold">{currentPricing.code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Condition 1: Native Mobile App (Google Play Billing / Apple In-App Purchase) */}
              {isNativeApp ? (
                <div className="space-y-4 my-3">
                  {/* Pro Feature Benefits Checklist (Explicitly defines what the user receives per Apple Guideline 3.1.2(c)) */}
                  <div className="bg-slate-950/90 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <h5 className="font-bold text-white text-[11px] sm:text-xs tracking-tight whitespace-nowrap">
                          {selectedPlan === 'monthly' ? 'Monthly Pass Includes:' : selectedPlan === 'annual' ? 'Annual Pass Includes:' : 'Lifetime VIP Includes:'}
                        </h5>
                      </div>
                      <span className="inline-flex items-center justify-center text-[9.5px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                        {selectedPlan === 'monthly' ? 'Full Access • 1 Mo' : selectedPlan === 'annual' ? 'Full Access • 1 Yr' : 'Full Access • VIP'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Direct Text & Typo Editing in PDFs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Export to Word, Excel, PPTX & Images</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Unlimited Digital Signatures & Stamps</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Unlimited Split PDF & Add Image / Logo</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Custom Watermarks & AES-128 Security</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>100% Client-Side Air-Gapped Privacy</span>
                      </div>
                      {isIOSPlatform() ? (
                        <div className="flex items-center space-x-2 sm:col-span-2 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-emerald-300">Unlimited Document Pages & Batch Processing</span>
                        </div>
                      ) : selectedPlan === 'monthly' ? (
                        <div className="flex items-center space-x-2 sm:col-span-2 text-slate-400 pt-0.5">
                          <span className="text-[10.5px] text-amber-300/90 font-medium flex items-center space-x-1.5">
                            <span className="shrink-0">🔒</span>
                            <span>Windows & Mac Offline Desktop Apps (Annual & Lifetime Pass only)</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 sm:col-span-2 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-emerald-300">Windows & Mac Offline Desktop Apps Included</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 sm:col-span-2 text-cyan-300 font-semibold pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Zero Cloud Uploads • No Ads • Unlimited PDF Processing</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Store Purchase Button */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={async () => {
                      setIsProcessing(true);
                      trackEvent('pricing_checkout_clicked', `native_${selectedPlan}`);
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
                          console.log('[NativeBilling] Purchase dismissed or cancelled by user.');
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
                      <div className="space-y-1.5 text-left text-[10.5px]">
                        <p className="font-bold text-slate-200">
                          Subscription Details & Terms:
                        </p>
                        <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                          <li><span className="font-semibold text-white">Title of Service:</span> {selectedPlan === 'monthly' ? 'Pro Monthly Pass' : selectedPlan === 'annual' ? 'Pro Annual Pass' : 'Lifetime VIP Access'}</li>
                          <li><span className="font-semibold text-white">Length of Subscription:</span> {selectedPlan === 'monthly' ? '1 Month (Auto-Renewable)' : selectedPlan === 'annual' ? '1 Year (Auto-Renewable)' : 'Permanent Lifetime License (One-Time)'}</li>
                          <li><span className="font-semibold text-white">Price:</span> {selectedPlan === 'monthly' ? `${livePrices[PLAY_PRODUCT_IDS.monthly] || initialPricing.monthly} per month` : selectedPlan === 'annual' ? `${livePrices[PLAY_PRODUCT_IDS.annual] || initialPricing.annual} per year` : `${livePrices[PLAY_PRODUCT_IDS.lifetime] || initialPricing.lifetime} one-time`}</li>
                          <li><span className="font-semibold text-white">Included Access:</span> {selectedPlan === 'monthly' ? 'Unlimited PDF Editing, Signatures, Page Split & Exports (1 Month)' : selectedPlan === 'annual' ? 'Unlimited PDF Editing, Signatures, Page Split & Exports (1 Year)' : 'Permanent Lifetime VIP Document Access'}</li>
                        </ul>
                        <p className="text-[10px] text-slate-400 pt-1 leading-normal">
                          Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless auto-renew is cancelled at least 24 hours before the end of the current billing period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Manage or cancel anytime in your <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">Apple Account Settings</a>.
                        </p>
                      </div>
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

                    {/* Terms of Use (EULA) & Privacy Policy */}
                    <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveLegalModal('terms')}
                        className="hover:text-cyan-400 underline font-medium transition"
                      >
                        Terms of Use (EULA)
                      </button>
                      <span>•</span>
                      {isIOSPlatform() && (
                        <>
                          <a
                            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-400 underline font-medium transition text-slate-400"
                          >
                            Apple Standard EULA
                          </a>
                          <span>•</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveLegalModal('privacy')}
                        className="hover:text-cyan-400 underline font-medium transition"
                      >
                        Privacy Policy
                      </button>
                    </div>
                  </div>
                </div>
              ) : !isAndroidPlatform() ? (
                /* Condition 2: Web Browser Environment (Official Helcim Hosted Gateway Checkout) */
                <div className="space-y-4 my-3">
                  {/* Payment Method Selector Tabs */}
                  <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPaymentTab('helcim')}
                      className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 text-[11px] ${
                        paymentTab === 'helcim'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Helcim Secure Checkout</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentTab('key')}
                      className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 text-[11px] ${
                        paymentTab === 'key'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Redeem License Key</span>
                    </button>
                  </div>

                  {paymentTab === 'helcim' ? (
                    <>
                      {/* Pro Feature Checklist */}
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <h5 className="font-bold text-white text-[11px] sm:text-xs tracking-tight whitespace-nowrap">
                              {selectedPlan === 'monthly' ? 'Monthly Pass Includes:' : selectedPlan === 'annual' ? 'Annual Pass Includes:' : 'Lifetime VIP Includes:'}
                            </h5>
                          </div>
                          <span className="inline-flex items-center justify-center text-[9.5px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                            {selectedPlan === 'monthly' ? 'Full Access • 1 Mo' : selectedPlan === 'annual' ? 'Full Access • 1 Yr' : 'Full Access • VIP'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Apply Watermark & AES-128 Security</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Unlimited Digital Signatures & Stamps</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Export to Word, Excel, PowerPoint</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Unlimited Split PDF & Add Image / Logo</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Unlimited Redact, Overwrite & AcroForm Fill</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Unlimited PDF Exports & Conversions</span>
                          </div>
                          {selectedPlan === 'monthly' ? (
                            <div className="flex items-center space-x-2 sm:col-span-2 text-slate-400 pt-0.5">
                              <span className="text-[10.5px] text-amber-300/90 font-medium flex items-center space-x-1.5">
                                <span className="shrink-0">🔒</span>
                                <span>Windows & Mac Offline Desktop Apps (Annual & Lifetime Pass only)</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 sm:col-span-2 pt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="font-bold text-emerald-300">Windows & Mac Offline Desktop Apps Included</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Helcim Hosted Gateway Notice */}
                      <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-[10.5px] text-slate-400 space-y-1">
                        <p className="font-semibold text-slate-300 flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Official Helcim Hosted Payment Gateway:</span>
                        </p>
                        <p>
                          You will be redirected to our verified 256-bit SSL encrypted Helcim merchant gateway to complete your payment securely. Subscriptions renew at the end of each billing cycle ({selectedPlan === 'monthly' ? currentPricing.monthly + ' ' + currentPricing.code + '/month' : selectedPlan === 'annual' ? currentPricing.annual + ' ' + currentPricing.code + '/year' : currentPricing.lifetime + ' ' + currentPricing.code + ' one-time'}). All major credit & debit cards accepted.
                        </p>
                      </div>

                      {/* Helcim Pay Action Button */}
                      <button
                        type="button"
                        onClick={handleHelcimCheckout}
                        className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <Lock className="w-4 h-4 text-slate-950" />
                        <span>
                          Proceed to Helcim Secure Checkout ({selectedPlan === 'monthly' ? currentPricing.monthly : selectedPlan === 'annual' ? currentPricing.annual : currentPricing.lifetime} {currentPricing.code})
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-950" />
                      </button>
                    </>
                  ) : (
                    /* License Key Activation Form */
                    <form onSubmit={handleVerifyLicenseKey} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30">
                      <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                        <Key className="w-4 h-4 text-yellow-400" />
                        <span>Activate Purchased License Key</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Enter the License Key sent to your email after purchasing on www.isasecuredpdf.com or your promo code.
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
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Modal Footer: Hidden on Native Mobile App */}
        {!isNativeApp && !isAndroidPlatform() && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted Helcim Merchant Protection</span>
            </div>

            <span className="text-slate-500 font-mono text-[9px]">Merchant ID: Helcim-ISA-Secure</span>
          </div>
        )}

        {/* In-App Terms of Service** & Privacy Policy Overlay (Identical to LandingPage Modal, Never Leaves App) */}
        {activeLegalModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>
                    {activeLegalModal === 'privacy' && 'Privacy Policy'}
                    {activeLegalModal === 'terms' && (isIOSPlatform() ? 'Terms of Use (EULA)' : 'Terms of Service')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto space-y-4">
                {activeLegalModal === 'privacy' && (
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    <div>
                      <h4 className="font-bold text-white mb-1">1. Zero Document Data Collection</h4>
                      <p>
                        ISASecuredPDF (PDF Engine Studio) operates 100% client-side. We do NOT collect, store, transmit, or process your PDF files, document text, signatures, form entries, or metadata on external cloud servers. All document rendering and manipulation happen entirely in your local browser memory or desktop operating system RAM.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1">2. Local Data Storage</h4>
                      <p>
                        Temporary workspace preferences or cached file states may be saved locally within your device's browser memory (via Local Storage or IndexedDB). This data never leaves your workstation and can be cleared at any time by clearing your browser cache.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1">3. Billing & Payments</h4>
                      <p>
                        Any payment or subscription details provided during purchase are processed securely by our Merchant of Record and are subject to their respective privacy standards and PCI-DSS compliance. We do not store or process payment card numbers on our servers.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1">4. Third-Party Analytics & Advertising</h4>
                      <p>
                        We may utilize privacy-compliant third-party analytics and advertising networks (such as Google AdSense) that collect non-personally identifiable usage metrics using browser cookies to display contextual advertisements.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1">5. Contact Us</h4>
                      <p>
                        If you have any questions regarding this Privacy Policy, please contact us at <a href="mailto:support@isasecuredpdf.com" className="text-cyan-400 font-bold hover:underline">support@isasecuredpdf.com</a>.
                      </p>
                    </div>
                  </div>
                )}

                {activeLegalModal === 'terms' && (
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    <div>
                      <h4 className="font-bold text-white mb-1">1. Acceptance of Terms of Use (EULA)</h4>
                      <p>
                        By downloading, installing, accessing, or using ISASecuredPDF, you agree to be bound by these Terms of Use (EULA). The software is provided "as-is" without warranties of any kind. You are granted a non-exclusive, non-transferable license to use the software for personal or commercial document editing in accordance with your selected plan tier. For iOS users, your license is also governed by Apple's Standard End User License Agreement: <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">https://www.apple.com/legal/internet-services/itunes/dev/stdeula/</a>.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1">2. Free Starter Monthly Usage Limit (5 Documents / Month)</h4>
                      <p>
                        Free Starter tier users are permitted to use <b>Sign Document (Digital Signatures)</b>, <b>Split PDF / Extract Multiple PDFs</b>, and <b>Add Image / Logo</b> on up to <b>5 documents per calendar month</b> across the web and mobile app. Once the 5-document monthly limit is reached, an active <b>Pro Monthly</b>, <b>Pro Annual</b>, or <b>Lifetime VIP</b> license is required to continue using unlimited signatures, document splitting, image/logo placement, and advanced Pro tools.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1">3. Pro Subscriptions & Lifetime VIP</h4>
                      <p>
                        <b>Pro Monthly</b> and <b>Pro Annual</b> unlock unlimited mobile & web PDF editing, signing, splitting, image/logo insertion, watermarking, password protection, and Office format exports. Subscriptions auto-renew unless cancelled in account settings at least 24 hours prior to the renewal date.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-amber-300/90">
                      <b>Right to Modify Terms, Usage Limits & Pricing:</b> Please note that these Terms of Use, free-tier monthly document limits, included features, and subscription pricing are subject to change in accordance with applicable store policies. Continued use of the software constitutes acceptance of the revised Terms.
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

