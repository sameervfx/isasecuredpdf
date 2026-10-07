import React, { useState } from 'react';
import { Star, ShieldCheck, CheckCircle2, ExternalLink, MessageSquare, Linkedin, Smartphone } from 'lucide-react';

interface ReviewsSectionProps {
  isLight: boolean;
  sectionBgClass: string;
  cardBgClass: string;
  cardTitleClass: string;
  cardDescClass: string;
  headingTextClass: string;
}

interface Testimonial {
  name: string;
  role: string;
  source: 'linkedin' | 'playstore';
  device?: string;
  stars: number;
  highlight: string;
  quote: string;
  verified: boolean;
  avatarBg: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Akhil Pokle',
    role: 'Senior Manager – IT @ DNEG Creative Services',
    source: 'linkedin',
    stars: 5,
    highlight: 'Studio-Grade On-Device Privacy',
    quote: 'Really liked ISA Secure PDF. The privacy-first approach is a big plus, especially keeping sensitive PDFs on-device. Loved the range of features too—editing, signing, scanning, encryption, compression, and form filling, all in one place. Clean and useful product. Great work Sameer!',
    verified: true,
    avatarBg: 'from-blue-600 to-indigo-700',
    initials: 'AP'
  },
  {
    name: 'Hamza Ehtisham',
    role: 'Head Resources, Execution & Competence @ Siemens',
    source: 'linkedin',
    stars: 5,
    highlight: 'Enterprise Usability & Workflow Agility',
    quote: 'The usability is really good. Will be using the same. Thanks Sameer Malik',
    verified: true,
    avatarBg: 'from-teal-600 to-cyan-700',
    initials: 'HE'
  },
  {
    name: 'Adeel Malik',
    role: '6th Generation Perfumer & Formulator',
    device: 'OnePlus 11 5G',
    source: 'playstore',
    stars: 5,
    highlight: 'Safeguarding Generational Trade Secrets',
    quote: 'Safe for our secret attar recipe notes. Our family is making shamama and ruh khas for 6 generations. All my raw material mixing notes and formulas are in PDF—other apps upload files on internet which is risky. This app keeps everything inside my phone only. Very safe.',
    verified: true,
    avatarBg: 'from-amber-500 to-orange-600',
    initials: 'AM'
  },
  {
    name: 'Syed Ala',
    role: 'Verified Android User',
    device: 'Redmi Note 10T 5G',
    source: 'playstore',
    stars: 5,
    highlight: 'Modern Technology & Precious Privacy Sector',
    quote: "Nice application, easy to use... Developer already knows about the precious privacy sector, that's why they worked really well on it. Keep growing guys! Perfect example of modern technology and privacy with premium features.",
    verified: true,
    avatarBg: 'from-rose-500 to-pink-600',
    initials: 'SA'
  },
  {
    name: 'Shivam Srivastava',
    role: 'Verified Android User',
    device: 'OnePlus Nord2 5G',
    source: 'playstore',
    stars: 5,
    highlight: 'User-Friendly & Clean Interface',
    quote: 'User-friendly app...clean UI',
    verified: true,
    avatarBg: 'from-sky-500 to-indigo-600',
    initials: 'SS'
  },
  {
    name: 'Abdullah Mushtaq',
    role: 'VFX Paint Artist',
    source: 'linkedin',
    stars: 5,
    highlight: 'Zero Server Ingestion for Sensitive Files',
    quote: "It's an amazing tool! I love that it is 100% privacy first and edits documents completely on device without uploading them to servers. It makes handling sensitive files incredibly safe and easy. Great work!",
    verified: true,
    avatarBg: 'from-cyan-600 to-blue-700',
    initials: 'AM'
  },
  {
    name: 'Santosh Mishra',
    role: 'Senior Compositor (15+ Years in VFX)',
    source: 'linkedin',
    stars: 5,
    highlight: 'Exceptional UX with Social Purpose',
    quote: "Really impressive work, Sameer Bhai. It's great to see you transforming a personal need into a meaningful and practical solution, while keeping privacy and social impact at the core. The overall usability and user experience are exceptionally well thought out.",
    verified: true,
    avatarBg: 'from-emerald-600 to-teal-700',
    initials: 'SM'
  },
  {
    name: 'Amol Dani',
    role: 'Senior Customer Experience & Service Operations Leader',
    source: 'linkedin',
    stars: 5,
    highlight: 'Genuinely Useful with True Privacy',
    quote: 'Really impressive, Sameer! Great to see you turning a personal need into something genuinely useful, with privacy and a great cause behind it. 👏',
    verified: true,
    avatarBg: 'from-purple-600 to-indigo-800',
    initials: 'AD'
  },
  {
    name: 'Irtiza Ali',
    role: 'Verified Android User',
    device: 'Xiaomi Redmi Note 7 Pro',
    source: 'playstore',
    stars: 5,
    highlight: 'Free, Fast & Easy to Use',
    quote: 'Very good PDF reader. Free and easy to use, love it... 👍 Smooth on-device performance.',
    verified: true,
    avatarBg: 'from-sky-500 to-blue-600',
    initials: 'IA'
  },
  {
    name: 'Abdul Rahman',
    role: 'Filmmaker | VFX Head & Supervisor | Producer',
    source: 'linkedin',
    stars: 5,
    highlight: 'Built for Production Workflows',
    quote: 'Amazing Sameer Malik! The usability and purpose behind this is nothing but praiseworthy. Keep up the great work!',
    verified: true,
    avatarBg: 'from-teal-600 to-emerald-700',
    initials: 'AR'
  },
  {
    name: 'Fuzal Ali',
    role: 'Verified Android User',
    device: 'Samsung Galaxy S25 Ultra',
    source: 'playstore',
    stars: 5,
    highlight: 'Clean & Ad-Free Experience',
    quote: 'Good app. Fast, reliable on-device processing and completely ad-free.',
    verified: true,
    avatarBg: 'from-violet-600 to-purple-700',
    initials: 'FA'
  }
];

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  isLight,
  sectionBgClass,
  cardBgClass,
  cardTitleClass,
  cardDescClass,
  headingTextClass
}) => {
  const [filter, setFilter] = useState<'all' | 'enterprise' | 'playstore'>('all');

  const filteredTestimonials = TESTIMONIALS.filter((item) => {
    if (filter === 'enterprise') return item.source === 'linkedin';
    if (filter === 'playstore') return item.source === 'playstore';
    return true;
  });

  return (
    <section id="reviews" className={`scroll-mt-24 py-20 ${sectionBgClass} px-4 lg:px-8 relative overflow-hidden`}>
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Verified Community & Industry Feedback</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold ${headingTextClass} tracking-tight`}>
            Trusted by VFX Leaders, Enterprise IT & Real Users
          </h2>
          <p className={`mt-3 text-sm sm:text-base ${cardDescClass} leading-relaxed`}>
            From Tier-1 film studio managers safeguarding pre-release scripts to 6th-generation artisans protecting proprietary trade recipes—here is why people choose 100% on-device document security.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-7">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                filter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>All Feedback ({TESTIMONIALS.length})</span>
            </button>

            <button
              onClick={() => setFilter('enterprise')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                filter === 'enterprise'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              <span>Industry & VFX Leaders</span>
            </button>

            <button
              onClick={() => setFilter('playstore')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                filter === 'playstore'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Play 5.0 ★ Reviews</span>
            </button>
          </div>
        </div>

        {/* Testimonials Masonry / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((t, idx) => (
            <div
              key={idx}
              className={`${cardBgClass} p-6 rounded-2xl flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-xl transition-all duration-300 group`}
            >
              <div>
                {/* Header: Avatar, Info, Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${t.avatarBg} text-white font-extrabold flex items-center justify-center text-sm shadow-md flex-shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-sm font-bold ${cardTitleClass}`}>{t.name}</span>
                        {t.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5 line-clamp-1">
                        {t.role}
                      </p>
                    </div>
                  </div>

                  {/* Source Icon Badge */}
                  {t.source === 'linkedin' ? (
                    <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg flex-shrink-0" title="Verified LinkedIn Connection">
                      <Linkedin className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex-shrink-0" title="Verified Google Play Review">
                      <Smartphone className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Star Rating & Highlight */}
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[11px] font-bold text-amber-400 ml-1.5">5.0</span>
                </div>

                <div className="text-xs font-bold text-cyan-400 mb-2">
                  "{t.highlight}"
                </div>

                {/* Quote */}
                <p className={`text-xs ${cardDescClass} leading-relaxed italic`}>
                  "{t.quote}"
                </p>
              </div>

              {/* Card Footer: Metadata */}
              <div className="mt-5 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
                <span>{t.device ? `Device: ${t.device}` : 'Enterprise Endorsement'}</span>
                <span className="font-semibold text-slate-400">
                  {t.source === 'linkedin' ? 'LinkedIn Verified' : 'Google Play Store'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Proof Strip */}
        <div className="mt-14 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center justify-center md:justify-start space-x-2">
                <span>100% Client-Side Privacy Guarantee</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  0.00 KB Egress
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Independently verifiable via Chrome DevTools Network Tab: 0 requests transmitted.
              </p>
            </div>
          </div>

          <a
            href="https://play.google.com/store/apps/details?id=com.isasecuredpdf.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-2 flex-shrink-0"
          >
            <Star className="w-4 h-4 fill-slate-950" />
            <span>View All 5-Star Reviews on Play Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
