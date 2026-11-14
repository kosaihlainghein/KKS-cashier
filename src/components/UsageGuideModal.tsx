import React, { useState } from 'react';
import { TranslationDictionary, Language } from '../data/translations';
import { soundFX } from '../utils/audio';

interface UsageGuideModalProps {
  onClose: () => void;
  t: TranslationDictionary;
  language: Language;
  onToggleLanguage: () => void;
  initialStep?: number;
  onExecuteStepAction?: (stepNumber: number) => void;
}

export const UsageGuideModal: React.FC<UsageGuideModalProps> = ({
  onClose,
  t,
  language,
  onToggleLanguage,
  initialStep = 1,
  onExecuteStepAction,
}) => {
  const [activeStep, setActiveStep] = useState<number>(initialStep);
  const [viewMode, setViewMode] = useState<'stepper' | 'fullSheet'>('stepper');

  const steps = [
    {
      num: 1,
      title: t.step1Name,
      desc: t.step1Desc,
      details: t.step1Details,
      tip: t.step1Tip,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      shortcut: 'SPACEBAR',
      tag: 'SCAN',
    },
    {
      num: 2,
      title: t.step2Name,
      desc: t.step2Desc,
      details: t.step2Details,
      tip: t.step2Tip,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      shortcut: '+ / -',
      tag: 'REVIEW',
    },
    {
      num: 3,
      title: t.step3Name,
      desc: t.step3Desc,
      details: t.step3Details,
      tip: t.step3Tip,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      shortcut: 'ENTER',
      tag: 'CHECKOUT',
    },
    {
      num: 4,
      title: t.step4Name,
      desc: t.step4Desc,
      details: t.step4Details,
      tip: t.step4Tip,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      shortcut: '4 METHODS',
      tag: 'PAYMENT',
    },
    {
      num: 5,
      title: t.step5Name,
      desc: t.step5Desc,
      details: t.step5Details,
      tip: t.step5Tip,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
      shortcut: 'CTRL + P',
      tag: 'RECEIPT',
    },
    {
      num: 6,
      title: t.step6Name,
      desc: t.step6Desc,
      details: t.step6Details,
      tip: t.step6Tip,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      shortcut: 'Z-REPORT',
      tag: 'REPORTS',
    },
  ];

  const current = steps[activeStep - 1] || steps[0];

  const handleStepSelect = (stepNum: number) => {
    soundFX.playClick();
    setActiveStep(stepNum);
  };

  const handleNext = () => {
    if (activeStep < steps.length) {
      soundFX.playClick();
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      soundFX.playClick();
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0c10] border-2 border-amber-500/40 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(245,183,0,0.25)] overflow-hidden">
        {/* Header with Title and Bilingual Quick Toggle */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/25 bg-gradient-to-r from-amber-950/40 via-black to-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 flex items-center justify-center shadow-[0_0_15px_rgba(245,183,0,0.4)] border border-amber-300/40 shrink-0">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron font-bold text-base sm:text-lg text-amber-300 tracking-wider">
                  {t.guideTitle}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  {t.workflowOverview}
                </span>
              </div>
              <p className="text-xs text-amber-400/70 font-mono mt-0.5">
                {t.guideSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle view mode */}
            <div className="hidden sm:flex items-center p-0.5 bg-black/60 border border-amber-500/30 rounded-lg text-xs font-mono">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setViewMode('stepper');
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'stepper'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : 'text-amber-400/60 hover:text-amber-300'
                }`}
              >
                1-by-1
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setViewMode('fullSheet');
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'fullSheet'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : 'text-amber-400/60 hover:text-amber-300'
                }`}
              >
                Full Overview
              </button>
            </div>

            {/* Language toggle inside guide */}
            <button
              onClick={() => {
                soundFX.playClick();
                onToggleLanguage();
              }}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 text-xs font-semibold text-amber-300 hover:border-amber-300 transition-colors flex items-center gap-1.5"
              title={t.toggleLangTitle}
            >
              <span className="font-orbitron text-[11px]">{language === 'en' ? 'EN' : 'MY'}</span>
              <span className="text-[10px] text-amber-400/80">{language === 'en' ? 'မြန်မာ' : 'English'}</span>
            </button>

            {/* Close */}
            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="p-1.5 text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 6-Step Workflow Navigation Ribbon */}
        <div className="bg-[#12141c] border-b border-amber-500/20 px-3 py-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[620px] gap-1">
            {steps.map((st, index) => {
              const isActive = activeStep === st.num;
              const isPassed = activeStep > st.num;
              return (
                <React.Fragment key={st.num}>
                  <button
                    onClick={() => handleStepSelect(st.num)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all group shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_15px_rgba(245,183,0,0.5)] font-bold'
                        : isPassed
                        ? 'bg-amber-950/30 text-amber-300 border border-amber-500/30 hover:border-amber-400'
                        : 'bg-black/40 text-amber-400/60 border border-neutral-800 hover:border-amber-500/40 hover:text-amber-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-orbitron text-xs font-bold ${
                        isActive
                          ? 'bg-black text-amber-300'
                          : isPassed
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {st.num}
                    </span>
                    <span className="whitespace-nowrap">{st.title}</span>
                  </button>

                  {index < steps.length - 1 && (
                    <div className="text-amber-500/40 px-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {viewMode === 'stepper' ? (
            /* Single Step Focus View */
            <div className="space-y-6 animate-fadeIn">
              {/* Step Card Header */}
              <div className="bg-[#14161f] border border-amber-500/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex flex-col items-center justify-center text-black shadow-[0_0_20px_rgba(245,183,0,0.4)] shrink-0 border border-amber-200/50">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest leading-none">
                      {t.stepIndicatorPrefix}
                    </span>
                    <span className="font-orbitron font-extrabold text-2xl leading-tight">
                      {current.num}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-orbitron font-bold text-lg sm:text-xl text-amber-200">
                        {current.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {current.tag}
                      </span>
                    </div>
                    <p className="text-sm text-amber-300/80 mt-1 max-w-xl">
                      {current.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-amber-500/30 text-amber-400/90 text-xs font-mono">
                    <span className="text-amber-500/50 mr-1.5">KEY:</span>
                    <span className="font-bold text-amber-300">{current.shortcut}</span>
                  </div>
                </div>
              </div>

              {/* Step Details & Action Steps */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left 7 cols: Detailed Checklist instructions */}
                <div className="md:col-span-7 bg-[#10121a] border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <h4 className="font-orbitron text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Standard Operating Procedure
                  </h4>

                  <ul className="space-y-3">
                    {current.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-200/90 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5 border border-amber-500/30">
                          {idx + 1}
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Quick Action Button to try step */}
                  {onExecuteStepAction && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          soundFX.playGoldChime();
                          onClose();
                          onExecuteStepAction(current.num);
                        }}
                        className="btn-gold-ripple px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(245,183,0,0.3)] hover:brightness-110 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{t.practiceStepAction}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right 5 cols: Pro Cashier Tip Box & Visual Reference */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="bg-gradient-to-br from-amber-950/40 via-[#181510] to-neutral-950 border border-amber-500/35 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-300 font-orbitron font-bold text-xs uppercase tracking-wider">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>{t.proCashierTip}</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                      {current.tip}
                    </p>
                  </div>

                  <div className="bg-black/60 border border-amber-500/20 rounded-2xl p-4 flex-1 flex flex-col justify-between text-xs font-mono text-amber-500/70">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-500/10">
                      <span>FLOW STAGE:</span>
                      <span className="text-amber-300 font-bold">{activeStep} / {steps.length}</span>
                    </div>
                    <div className="py-3 text-[11px] text-neutral-400">
                      {activeStep === 1 && 'Barcode optics calibrated at 589.3nm wavelength for 100% tag recognition.'}
                      {activeStep === 2 && 'Automatic 60% promotional cap protects store margins on high-value jewelry.'}
                      {activeStep === 3 && 'Compliant with California & Luxury Goods tax regimes.'}
                      {activeStep === 4 && 'Multi-rail settlement terminal supports both fiat and decentralized AU tokens.'}
                      {activeStep === 5 && 'Thermal print engine outputs tamper-proof certificate hashes.'}
                      {activeStep === 6 && 'Shift reconciliation logs synchronized with central management.'}
                    </div>
                    <div className="text-[10px] text-amber-500/50">
                      STATUS: ENCRYPTED & VERIFIED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Full Sheet Overview (All 6 Steps Together) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
              {steps.map((st) => (
                <div
                  key={st.num}
                  onClick={() => {
                    handleStepSelect(st.num);
                    setViewMode('stepper');
                  }}
                  className="bg-[#12141c] border border-amber-500/25 rounded-2xl p-4.5 hover:border-amber-400 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(245,183,0,0.25)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-orbitron font-bold text-xs">
                        {st.num}
                      </span>
                      <h4 className="font-orbitron font-bold text-sm text-amber-200 group-hover:text-amber-300">
                        {st.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500/60 bg-black/60 px-2 py-0.5 rounded border border-amber-500/20">
                      {st.shortcut}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-2">
                    {st.desc}
                  </p>

                  <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between text-[11px] text-amber-400/80 font-mono">
                    <span>{st.details.length} Key Actions</span>
                    <span className="group-hover:translate-x-1 transition-transform text-amber-300">
                      Learn Step →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 border-t border-amber-500/20 bg-black/80 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={activeStep === 1}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
              activeStep === 1
                ? 'opacity-40 cursor-not-allowed border-neutral-800 text-neutral-600'
                : 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 cursor-pointer'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t.prevStep}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-amber-400/80">
            {steps.map((st) => (
              <span
                key={st.num}
                onClick={() => handleStepSelect(st.num)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                  activeStep === st.num
                    ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                    : 'bg-neutral-700 hover:bg-amber-500/50'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeStep < steps.length ? (
              <button
                onClick={handleNext}
                className="btn-gold-ripple px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(245,183,0,0.3)] hover:brightness-110 cursor-pointer"
              >
                <span>{t.nextStep}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFX.playGoldChime();
                  onClose();
                }}
                className="btn-gold-ripple px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(245,183,0,0.4)] hover:brightness-110 cursor-pointer"
              >
                <span>{t.closeGuide}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
