import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface HoloScannerProps {
  onProductScanned: (product: Product) => void;
  availableProducts: Product[];
  onOpenManualEntry: () => void;
  onOpenLiveCameraScanner?: () => void;
  currency?: CurrencyMode;
  t: TranslationDictionary;
}

export const HoloScanner: React.FC<HoloScannerProps> = ({
  onProductScanned,
  availableProducts,
  onOpenManualEntry,
  onOpenLiveCameraScanner,
  currency = 'MMK',
  t,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fast trigger scan with laser effect
  const triggerScan = (productToScan?: Product) => {
    const prod = productToScan || availableProducts[0];
    if (!prod) return;

    soundFX.playScanBeep();
    setIsScanning(true);
    setLastScanned(prod);

    setTimeout(() => {
      onProductScanned(prod);
      setIsScanning(false);
    }, 380);
  };

  // Handle direct barcode search / hardware barcode reader entry
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    // Search by barcode, SKU, or product name
    const match = availableProducts.find(
      (p) =>
        p.barcode.toLowerCase() === query.toLowerCase() ||
        p.sku.toLowerCase() === query.toLowerCase() ||
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      triggerScan(match);
      setInputFeedback(`✓ တွေ့ရှိသည်: ${match.name}`);
      setBarcodeInput('');
      setTimeout(() => setInputFeedback(null), 3000);
    } else {
      soundFX.playWarning();
      setInputFeedback(`⚠️ မတွေ့ရှိပါ: "${query}" (ပစ္စည်းအသစ် ထည့်သွင်းရန်နှိပ်ပါ)`);
    }
  };

  // Keyboard shortcut: Pressing Space outside input triggers scan; pressing '/' focuses barcode input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#10121a] via-[#090b10] to-[#050609] border border-amber-500/30 p-4 sm:p-6 overflow-hidden shadow-[0_4px_35px_rgba(0,0,0,0.6)]">
      {/* Ambient background gold aura */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar of centerpiece */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ping" />
          <span className="font-orbitron text-xs sm:text-sm tracking-widest text-amber-300 font-bold uppercase">
            {t.opticalSensor}
          </span>
          <span className="text-[11px] font-mono text-amber-500/70 hidden sm:inline">
            · HOLOGRAPHIC SCANNER
          </span>
        </div>

        {/* Barcode / SKU Hardware Reader Form */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="ဘားကုဒ် / SKU ရိုက်ပါ (သို့) စကင်ဖတ်ပါ..."
              className="w-full bg-[#12141d] border border-amber-500/35 rounded-xl px-3.5 py-1.5 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-400/40 font-mono transition-colors shadow-inner"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-amber-500/40 pointer-events-none hidden sm:inline">
              [Enter]
            </span>
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
          >
            ရှာမည်
          </button>
        </form>
      </div>

      {/* Input feedback message */}
      {inputFeedback && (
        <div
          onClick={() => {
            if (inputFeedback.includes('⚠️')) {
              onOpenManualEntry();
            }
          }}
          className={`mb-3 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer ${
            inputFeedback.includes('⚠️')
              ? 'bg-rose-950/30 border border-rose-500/40 text-rose-300 hover:bg-rose-950/50'
              : 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          <span>{inputFeedback}</span>
          {inputFeedback.includes('⚠️') && (
            <span className="text-amber-300 font-bold underline">+ ပစ္စည်းသစ်အဖြစ် ထည့်ရန်</span>
          )}
        </div>
      )}

      {/* Main Holographic Chamber */}
      <div className="relative h-60 sm:h-64 w-full rounded-2xl bg-black/75 border border-amber-500/25 flex items-center justify-center overflow-hidden shadow-inner">
        {/* Holographic perspective grid floor */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(245, 183, 0, 0.45) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(245, 183, 0, 0.45) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            transform: 'perspective(300px) rotateX(45deg) translateY(-20px)',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Ambient Holographic Rings */}
        <div
          className="absolute w-52 h-52 rounded-full border border-amber-500/20 animate-spin pointer-events-none"
          style={{ animationDuration: '28s' }}
        />
        <div
          className="absolute w-72 h-72 rounded-full border border-dashed border-amber-400/15 animate-spin pointer-events-none"
          style={{ animationDuration: '40s', animationDirection: 'reverse' }}
        />

        {/* Sweep Laser Beam */}
        <div className="absolute inset-x-8 top-0 bottom-0 pointer-events-none">
          <div
            className={`absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_20px_#fbbf24] transition-opacity duration-300 ${
              isScanning ? 'opacity-100 h-1.5 shadow-[0_0_30px_#fbbf24]' : 'animate-gold-beam opacity-80'
            }`}
          />
          {/* Laser vertical curtain glow */}
          <div className="absolute inset-x-4 top-0 h-16 bg-gradient-to-b from-amber-400/20 to-transparent pointer-events-none opacity-60 animate-pulse" />
        </div>

        {/* Reticle / Target Matrix */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm">
          {/* 4 Corner Targeting brackets */}
          <div className="absolute -inset-4 pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.6)]" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.6)]" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.6)]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.6)]" />
          </div>

          {/* Center Hologram Barcode Visual */}
          <div className="p-3.5 rounded-2xl bg-black/85 border border-amber-400/40 backdrop-blur-md shadow-[0_0_25px_rgba(245,183,0,0.25)] mb-3 flex items-center gap-3.5">
            {lastScanned?.image ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-amber-400/70 shadow-[0_0_14px_rgba(245,183,0,0.4)] shrink-0">
                <img
                  src={lastScanned.image}
                  alt={lastScanned.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-300 shrink-0">
                ⚡
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1 justify-center h-8 w-44 px-2 bg-amber-950/30 rounded border border-amber-500/20">
                {/* Simulated barcode bars */}
                {[4, 2, 6, 1, 3, 5, 2, 7, 1, 4, 2, 5, 3, 6, 2, 4, 6, 2, 1, 5].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-amber-300 rounded-sm transition-opacity duration-300 ${
                      isScanning ? 'bg-amber-100 shadow-[0_0_8px_#fbbf24]' : 'opacity-85'
                    }`}
                    style={{ height: `${h * 3 + 10}px` }}
                  />
                ))}
              </div>
              <div className="mt-1 font-mono text-[11px] tracking-wider text-amber-300/90 truncate max-w-[176px]">
                {lastScanned ? `${lastScanned.name}` : '8859-1028-3710'}
              </div>
            </div>
          </div>

          {/* Scanner prompt status */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-orbitron text-xs sm:text-sm font-bold text-amber-200 gold-outline-text tracking-wider">
              {isScanning ? t.readingCipher : t.readyForScan}
            </span>
            <span className="text-[11px] text-amber-500/80 font-mono">
              {t.alignPrompt}
            </span>
          </div>
        </div>

        {/* Scan Flash Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-amber-400/25 backdrop-blur-[1px] animate-ping pointer-events-none" />
        )}
      </div>

      {/* Interactive Quick Add / Action Bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Quick Item Direct Click Row */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-mono text-amber-500/80 uppercase whitespace-nowrap shrink-0">
            {t.targetItem}:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {availableProducts.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => triggerScan(p)}
                className="px-2.5 py-1 rounded-lg bg-[#12141e] border border-amber-500/25 hover:border-amber-400/60 hover:bg-amber-500/15 text-[11px] font-semibold text-amber-200 whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-4 h-4 rounded object-cover border border-amber-400/40"
                  />
                )}
                <span className="truncate max-w-[120px]">{p.name.split(' ')[0]}</span>
                <span className="text-amber-400 font-mono font-bold">
                  {formatPrice(p.price, currency)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenLiveCameraScanner && (
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenLiveCameraScanner();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/60 rounded-xl hover:bg-amber-500/25 hover:border-amber-300 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Device Camera Barcode Scanner"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Camera</span>
            </button>
          )}

          <button
            onClick={() => {
              soundFX.playClick();
              onOpenManualEntry();
            }}
            className="px-3.5 py-2 text-xs font-semibold text-amber-300/80 bg-neutral-900/80 border border-amber-500/30 rounded-xl hover:bg-amber-500/10 hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.manualEntry}
          </button>

          <button
            onClick={() => triggerScan()}
            disabled={isScanning || availableProducts.length === 0}
            className="btn-gold-ripple px-5 py-2 text-xs font-orbitron font-bold tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-xl shadow-[0_0_20px_rgba(245,183,0,0.45)] border border-amber-200/50 flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>{isScanning ? t.transmitting : t.triggerScan}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
