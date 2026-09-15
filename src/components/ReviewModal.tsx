import React, { useState } from 'react';
import { Star, X, MessageSquare, ThumbsUp, Heart, ExternalLink, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRated?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onRated }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedType, setSubmittedType] = useState<'store' | 'feedback' | null>(null);

  if (!isOpen) return null;

  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.isasecuredpdf.app';

  const handleStarClick = (num: number) => {
    setRating(num);
  };

  const handleGooglePlayReview = () => {
    localStorage.setItem('isa_has_rated', 'true');
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
    setSubmittedType('store');
    setIsSubmitted(true);
    if (onRated) onRated();
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handlePrivateFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isa_has_rated', 'true');
    setSubmittedType('feedback');
    setIsSubmitted(true);
    if (onRated) onRated();
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleDismiss = () => {
    // Dismiss for now, ask again later after 5 more exports
    localStorage.setItem('isa_export_count', '0');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-slate-100 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 space-y-4 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {submittedType === 'store' ? 'Thank You for Rating Us! 🎉' : 'Feedback Received! 🙏'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              {submittedType === 'store'
                ? 'Your 5-star support keeps ISA Secured PDF 100% free of cloud tracking and server ads.'
                : 'We truly appreciate your input and will use it to make ISA Secured PDF even better!'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Star className="w-8 h-8 fill-slate-950 stroke-[1.5]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                Help Us Grow
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">Enjoying ISASecured PDF?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Tap the stars below to rate your experience. Your review helps others discover 100% client-side private PDF editing.
              </p>
            </div>

            {/* Interactive 5 Gold Stars */}
            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const active = starNum <= (hoverRating || rating);
                return (
                  <button
                    key={starNum}
                    type="button"
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleStarClick(starNum)}
                    className="p-1 transition transform active:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                        active
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'text-slate-700 hover:text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Conditional Branching based on selected rating */}
            {rating >= 4 && (
              <div className="space-y-3 animate-fade-in pt-1">
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs rounded-xl font-semibold">
                  🌟 Wow, 5 Stars! Would you mind leaving a quick review on Google Play Store?
                </div>

                <button
                  type="button"
                  onClick={handleGooglePlayReview}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/20 transition transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>Leave 5-Star Review on Google Play</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}

            {rating > 0 && rating <= 3 && (
              <form onSubmit={handlePrivateFeedbackSubmit} className="space-y-3 animate-fade-in text-left pt-1">
                <div className="p-2.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl font-medium">
                  We're sorry we didn't hit 5 stars! Tell us how we can make the app better for you:
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What feature would you like to see or fix? (optional)..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-xl p-3 outline-none resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Send Feedback to Developers</span>
                </button>
              </form>
            )}

            {rating === 0 && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="hover:text-slate-200 transition"
                >
                  Maybe Later
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('isa_has_rated', 'true');
                    onClose();
                  }}
                  className="hover:text-slate-200 transition"
                >
                  Already Rated
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
