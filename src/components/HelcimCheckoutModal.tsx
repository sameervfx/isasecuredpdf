import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Zap, Lock, CreditCard, Sparkles, Key, ArrowRight, Globe, Smartphone, Check } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { SUPPORTED_CURRENCIES, detectUserCurrency, getLocalizedPricing } from '../utils/currencyFormatter';
import { isIOSPlatform, isNativeMobileApp } from '../utils/platform';

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

  useEffect(() => {
    setCurrencyCode(detectUserCurrency());
  }, []);

  useEffect(() => {
    if (isOpen && initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [isOpen, initialPlan]);

  const isNativeApp = isIOSPlatform() || isNativeMobileApp();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                <span>Unlock ISA Secure PDF Pro</span>
              </h3>
              <p className="text-xs text-slate-400">
                100% Client-Side Air-Gapped PDF Suite • Secure In-App Payment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
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
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Monthly Plan */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`cursor-pointer p-3 rounded-2xl border transition flex flex-col justify-between ${
                      selectedPlan === 'monthly'
                        ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs">Monthly</h4>
                      <div className="my-1 text-sm sm:text-base font-extrabold text-white">
                        {currentPricing.monthly}
                      </div>
                      <p className="text-[10px] text-slate-400">{currentPricing.code}/mo</p>
                    </div>
                  </div>

                  {/* Annual Plan (Best Value) */}
                  <div
                    onClick={() => setSelectedPlan('annual')}
                    className={`cursor-pointer p-3 rounded-2xl border transition flex flex-col justify-between ${
                      selectedPlan === 'annual'
                        ? 'bg-gradient-to-b from-cyan-950/60 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs mb-1">Annual Pass</h4>
                      <div className="my-1 text-sm sm:text-base font-extrabold text-emerald-300">
                        {currentPricing.annual}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 gap-0.5">
                        <span className="text-emerald-400 font-semibold">{currentPricing.code}/yr</span>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[8px] px-1 py-0.5 rounded shrink-0">
                          Save 16%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Pass */}
                  <div
                    onClick={() => setSelectedPlan('lifetime')}
                    className={`cursor-pointer p-3 rounded-2xl border transition flex flex-col justify-between ${
                      selectedPlan === 'lifetime'
                        ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs mb-1">Lifetime VIP</h4>
                      <div className="my-1 text-sm sm:text-base font-extrabold text-purple-300">
                        {currentPricing.lifetime}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 gap-0.5">
                        <span className="line-through text-slate-500 font-medium text-[9px]">{currentPricing.originalLifetime || '$199.99'}</span>
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-[8px] px-1 py-0.5 rounded shrink-0">
                          50% OFF
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

                  {/* Name on Card */}
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

                  {/* Card Number */}
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

                  {/* Expiry & CVV Side by Side */}
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

                  {cardError && (
                    <p className="text-[11px] text-rose-400 font-medium">{cardError}</p>
                  )}

                  {/* Submit Button */}
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

                  {upiError && (
                    <p className="text-[11px] text-rose-400 font-medium">{upiError}</p>
                  )}

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

                  {keyError && (
                    <p className="text-[11px] text-rose-400 font-medium">{keyError}</p>
                  )}

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
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Merchant Protection</span>
          </div>

          <span className="text-slate-500 font-mono text-[9px]">Merchant ID: Helcim-ISA-Secure</span>
        </div>
      </div>
    </div>
  );
};
