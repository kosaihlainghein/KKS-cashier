import React from 'react';
import { soundFX } from '../utils/audio';
import { Language, TranslationDictionary } from '../data/translations';
import { CurrencyMode } from '../utils/formatters';

interface TopBarProps {
  currentView: 'pos' | 'analytics' | 'inventory';
  onViewChange: (view: 'pos' | 'analytics' | 'inventory') => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  activeItemCount: number;
  language: Language;
  onToggleLanguage: () => void;
  currency: CurrencyMode;
  onToggleCurrency: () => void;
  uiMode: 'pro' | 'simplified';
  onToggleMode: () => void;
  onOpenGuide: () => void;
  onOpenLiveCameraScanner: () => void;
  onOpenMultiDeviceSync: () => void;
  onOpenAddNewProduct?: () => void;
  onOpenMarketSearch?: () => void;
  currentUser?: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  onGoogleAuth?: () => void;
  connectedDevicesCount: number;
  isCloudSynced: boolean;
  isOnline?: boolean;
  pendingSyncCount?: number;
  registerId: string;
  cashierName: string;
  t: TranslationDictionary;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  isAudioMuted,
  onToggleAudio,
  activeItemCount,
  language,
  onToggleLanguage,
  currency,
  onToggleCurrency,
  uiMode,
  onToggleMode,
  onOpenGuide,
  onOpenLiveCameraScanner,
  onOpenMultiDeviceSync,
  onOpenAddNewProduct,
  onOpenMarketSearch,
  currentUser,
  onGoogleAuth,
  connectedDevicesCount,
  isOnline = true,
  pendingSyncCount = 0,
  registerId,
  cashierName,
  t,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#06080d]/95 backdrop-blur-md border-b border-amber-500/20 select-none shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all">
      {/* Upper Micro Trustline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 lg:gap-8">
        {/* ================= ZONE 1: BRAND ZONE ================= */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_18px_rgba(245,183,0,0.4)] border border-amber-200/50">
            <span className="font-orbitron text-black font-black text-sm tracking-tighter">KKS</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-orbitron font-extrabold text-sm sm:text-base tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 whitespace-nowrap drop-shadow-[0_0_10px_rgba(245,183,0,0.35)]">
                {t.brandName}
              </span>
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-amber-400/70 border border-amber-500/30 px-1.5 py-0.2 rounded bg-amber-950/30">
                GOLD
              </span>
            </div>
            <span className="text-[10px] tracking-wide text-amber-500/70 font-mono -mt-0.5 whitespace-nowrap">
              {language === 'my' ? 'စမတ် လက်လီလက်ကား အရောင်းစနစ်' : 'Enterprise Smart Retail POS'}
            </span>
          </div>
        </div>

        {/* ================= ZONE 2: PRIMARY NAVIGATION ================= */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#10121a]/90 border border-amber-500/25 rounded-xl shadow-inner">
          <button
            onClick={() => {
              soundFX.playClick();
              onViewChange('pos');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
              currentView === 'pos'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-[0_0_14px_rgba(245,183,0,0.45)]'
                : 'text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10'
            }`}
          >
            <span>{t.terminal}</span>
            {activeItemCount > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-amber-300 rounded font-mono text-[10px] font-bold">
                {activeItemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onViewChange('inventory');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'inventory'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-[0_0_14px_rgba(245,183,0,0.45)]'
                : 'text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10'
            }`}
          >
            {t.catalogVault}
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onViewChange('analytics');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'analytics'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-[0_0_14px_rgba(245,183,0,0.45)]'
                : 'text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10'
            }`}
          >
            {t.reports}
          </button>

          {onOpenMarketSearch && (
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenMarketSearch();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 text-amber-300/80 hover:text-amber-100 hover:bg-amber-500/10 cursor-pointer"
              title="Search Real-Time Retail Market Prices Grounded by Google Search"
            >
              <span>🔍</span>
              <span>{language === 'my' ? 'စျေးကွက်စုံစမ်း' : 'Market AI'}</span>
            </button>
          )}
        </nav>

        {/* ================= ZONE 3: ACTIONS & UTILITIES ================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Camera Scanner Trigger */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenLiveCameraScanner();
            }}
            className="btn-gold-ripple px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-400/50 bg-amber-500/15 text-amber-200 hover:border-amber-300 hover:shadow-[0_0_14px_rgba(245,183,0,0.35)] flex items-center gap-1.5 transition-all cursor-pointer group text-xs font-semibold"
            title="Open Device Camera Barcode Scanner"
          >
            <svg className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden xl:inline font-mono text-[11px] font-bold text-amber-300">SCAN</span>
          </button>

          {/* Multi-Device Station Status Indicator */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenMultiDeviceSync();
            }}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-xs font-mono ${
              isOnline
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.15)]'
            }`}
            title={
              isOnline
                ? `Cloud Synced (${connectedDevicesCount} terminals online)`
                : `Offline Mode (${pendingSyncCount} sales queued for sync)`
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse'
                  : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
              }`}
            />
            <span className="hidden sm:inline text-[11px] font-bold">
              {isOnline ? `${connectedDevicesCount} REG` : 'LOCAL'}
            </span>
          </button>

          {/* Mode Switcher: Pro vs Simplified */}
          <button
            onClick={() => {
              soundFX.playClick();
              onToggleMode();
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              uiMode === 'simplified'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,183,0,0.25)]'
                : 'bg-[#10121a] border-amber-500/30 text-amber-400/80 hover:text-amber-200 hover:border-amber-400'
            }`}
            title={uiMode === 'simplified' ? t.modeSwitchToPro : t.modeSwitchToSimple}
          >
            <span className="uppercase text-[11px]">{uiMode === 'simplified' ? 'EASY' : 'PRO'}</span>
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={() => {
              soundFX.playClick();
              onToggleLanguage();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/35 bg-[#10121a] text-amber-200 hover:border-amber-300 transition-all cursor-pointer text-xs font-semibold flex items-center gap-1"
            title={t.toggleLangTitle}
          >
            <span className="font-orbitron text-amber-300 text-[11px]">{language === 'en' ? 'EN' : 'MY'}</span>
          </button>

          {/* Currency Switcher */}
          <button
            onClick={() => {
              soundFX.playClick();
              onToggleCurrency();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/35 bg-[#10121a] text-amber-200 hover:border-amber-300 transition-all cursor-pointer text-xs font-mono font-bold flex items-center gap-1"
            title="Toggle Currency (MMK / USD)"
          >
            <span className="text-amber-300">{currency === 'MMK' ? 'ကျပ်' : '$'}</span>
          </button>

          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? t.audioUnmute : t.audioMute}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isAudioMuted
                ? 'border-neutral-800 text-neutral-500 hover:text-amber-300 hover:border-amber-500/30'
                : 'border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-[0_0_8px_rgba(245,183,0,0.2)]'
            }`}
          >
            {isAudioMuted ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Guide F1 Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenGuide();
            }}
            className="hidden sm:flex px-2 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 hover:border-amber-400 text-xs font-mono font-bold cursor-pointer"
            title={t.guideTitle}
          >
            F1
          </button>

          {/* Google Auth / Profile Sync */}
          {onGoogleAuth && (
            <button
              onClick={onGoogleAuth}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                currentUser
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-300'
                  : 'bg-[#10121a] border-amber-500/30 text-amber-300 hover:border-amber-400'
              }`}
              title={currentUser ? `Signed in as ${currentUser.email} (Click to sign out)` : 'Sign in with Google to sync with Cloud SQL'}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Google User"
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span className="hidden md:inline text-[11px] font-mono">
                {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Logged In') : 'Sign In'}
              </span>
            </button>
          )}

          {/* Primary Action: Add Product */}
          {onOpenAddNewProduct && (
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenAddNewProduct();
              }}
              className="btn-gold-ripple px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-[0_0_15px_rgba(245,183,0,0.4)] hover:brightness-110 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>+</span>
              <span className="hidden sm:inline">{language === 'my' ? 'ပစ္စည်းသစ်' : 'New Item'}</span>
            </button>
          )}

          {/* Cashier Chip */}
          <div
            onClick={onOpenMultiDeviceSync}
            className="flex items-center gap-2 pl-2 border-l border-amber-500/20 cursor-pointer group"
            title="Click to manage multi-device station"
          >
            <img
              src="/src/assets/images/cashier_avatar_1793336349519.jpg"
              alt="Cashier Manager"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-amber-400/50 shadow-[0_0_8px_rgba(245,183,0,0.3)] group-hover:border-amber-300 transition-colors"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
