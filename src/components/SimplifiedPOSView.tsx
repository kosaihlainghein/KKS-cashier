import React from 'react';
import { CartItem, Product, LoyaltyMember } from '../types';
import { TranslationDictionary, Language } from '../data/translations';
import { soundFX } from '../utils/audio';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface SimplifiedPOSViewProps {
  cart: CartItem[];
  products: Product[];
  activeLoyalty: LoyaltyMember | null;
  discountPercent: number;
  taxRate: number;
  onAddProduct: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenManualEntry: () => void;
  onOpenCatalog: () => void;
  onOpenQuickItem?: () => void;
  onOpenLoyaltyModal: () => void;
  onOpenDiscountModal: () => void;
  onInitiateCheckout: () => void;
  onOpenGuide: (step?: number) => void;
  onSwitchToPro: () => void;
  onOpenLiveCameraScanner?: () => void;
  currency?: CurrencyMode;
  t: TranslationDictionary;
  language: Language;
}

export const SimplifiedPOSView: React.FC<SimplifiedPOSViewProps> = ({
  cart,
  products,
  activeLoyalty,
  discountPercent,
  taxRate,
  onAddProduct,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenManualEntry,
  onOpenCatalog,
  onOpenQuickItem,
  onOpenLoyaltyModal,
  onOpenDiscountModal,
  onInitiateCheckout,
  onOpenGuide,
  onSwitchToPro,
  onOpenLiveCameraScanner,
  currency = 'MMK',
  t,
}) => {
  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const loyaltyRate = activeLoyalty ? activeLoyalty.discountRate : 0;
  const effectiveDiscountRate = Math.min(0.60, (discountPercent / 100) + loyaltyRate);
  const discountAmount = subtotal * effectiveDiscountRate;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Workflow current active step
  const currentWorkflowStep = cart.length === 0 ? 1 : 2;

  // Curated fast-track popular assets for instant 1-tap addition
  const popularAssets = products.slice(0, 6);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* 1. Interactive Step-by-Step Workflow Ribbon for Beginners */}
      <div className="bg-[#0e1017] border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2.5 border-b border-amber-500/15">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-orbitron font-bold text-xs tracking-wider text-amber-300 uppercase">
              {t.workflowRibbonTitle}:
            </span>
            <span className="text-xs text-amber-400/80 font-mono">
              {cart.length === 0
                ? t.simplifiedCheckoutEmpty
                : `${t.step2Name} · ${totalUnits} ${t.unitsInRegister}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenGuide(currentWorkflowStep)}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.guideBtn}</span>
            </button>

            <button
              onClick={onSwitchToPro}
              className="px-3 py-1 bg-neutral-900/80 hover:bg-amber-950/40 text-amber-400/80 hover:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono transition-all cursor-pointer"
              title={t.modeSwitchToPro}
            >
              {t.modeSwitchToPro}
            </button>
          </div>
        </div>

        {/* 6 Step Progress Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { num: 1, label: t.step1Name, active: cart.length === 0, badge: 'Scan' },
            { num: 2, label: t.step2Name, active: cart.length > 0, badge: 'Review' },
            { num: 3, label: t.step3Name, active: cart.length > 0, badge: 'Checkout' },
            { num: 4, label: t.step4Name, active: false, badge: 'Payment' },
            { num: 5, label: t.step5Name, active: false, badge: 'Receipt' },
            { num: 6, label: t.step6Name, active: false, badge: 'Reports' },
          ].map((st) => (
            <button
              key={st.num}
              onClick={() => onOpenGuide(st.num)}
              className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                st.active
                  ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,183,0,0.25)]'
                  : 'bg-black/40 border-neutral-800/80 text-amber-400/50 hover:border-amber-500/30 hover:text-amber-300'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-orbitron text-xs font-bold shrink-0 ${
                  st.active
                    ? 'bg-amber-400 text-black shadow-[0_0_8px_#f59e0b]'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {st.num}
              </span>
              <div className="truncate">
                <div className="text-[11px] font-bold leading-tight truncate">{st.label}</div>
                <div className="text-[9px] font-mono text-amber-500/60 uppercase">{st.badge}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Beginner Quick Action Bar & Fast-Track Shelf */}
      <div className="bg-[#0d0f16] border border-amber-500/30 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-orbitron font-bold text-sm tracking-wider text-amber-200 uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              {t.quickPickTitle}
            </h2>
            <p className="text-xs text-amber-500/70 font-mono mt-0.5">
              {t.quickPickSub}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenLiveCameraScanner && (
              <button
                onClick={() => {
                  soundFX.playClick();
                  onOpenLiveCameraScanner();
                }}
                className="btn-gold-ripple px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-600/35 border border-amber-400 text-amber-200 hover:brightness-110 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Camera Scan</span>
              </button>
            )}

            {onOpenQuickItem && (
              <button
                onClick={() => {
                  soundFX.playClick();
                  onOpenQuickItem();
                }}
                className="btn-gold-ripple px-3.5 py-1.5 rounded-xl bg-amber-500/25 border border-amber-400 text-amber-200 hover:bg-amber-500/35 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Add any custom item or price directly to bill"
              >
                <span>⚡</span>
                <span>အမြန်ရောင်း (Quick Item)</span>
              </button>
            )}

            <button
              onClick={() => {
                soundFX.playClick();
                onOpenCatalog();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:border-amber-300 hover:bg-amber-500/25 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>{t.catalogVault}</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                onOpenManualEntry();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/30 text-amber-300/90 hover:border-amber-400 hover:text-amber-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t.manualEntry}</span>
            </button>
          </div>
        </div>

        {/* 1-Tap Product Cards Grid (Clear, touch-friendly, high-contrast) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {popularAssets.length === 0 ? (
            <div className="col-span-full py-8 px-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-dashed border-amber-500/30 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl shrink-0">
                  📦
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-200">စတိုးဆိုင် ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ (No Products in Store)</div>
                  <div className="text-[11px] text-amber-500/70 font-mono mt-0.5">
                    သင့်ဆိုင်၏ ပစ္စည်းများကို စတင်ထည့်သွင်းပါ သို့မဟုတ် [⚡ အမြန်ရောင်း] ဖြင့် ချက်ချင်းရောင်းချနိုင်ပါသည်
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onOpenManualEntry}
                  className="btn-gold-ripple px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-bold shadow cursor-pointer whitespace-nowrap"
                >
                  + ပစ္စည်းအသစ်ထည့်မည်
                </button>
                {onOpenQuickItem && (
                  <button
                    onClick={onOpenQuickItem}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/40 text-amber-200 text-xs font-bold cursor-pointer hover:bg-neutral-800 whitespace-nowrap"
                  >
                    ⚡ အမြန်ရောင်း
                  </button>
                )}
              </div>
            </div>
          ) : (
            popularAssets.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  soundFX.playScanBeep();
                  onAddProduct(product);
                }}
                className="group bg-[#131620] hover:bg-[#181b28] border border-amber-500/25 hover:border-amber-400 rounded-xl p-3 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(245,183,0,0.25)] flex flex-col justify-between"
              >
                <div>
                  {/* Product Image (ပုံနှင့်တကွ) */}
                  <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-black/60 border border-amber-500/20 mb-2 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-2xl">
                        {product.category.includes('ပါတိတ်') || product.category.includes('အထည်')
                          ? '👗'
                          : product.category.includes('စားသောက်ကုန်')
                          ? '🥫'
                          : product.category.includes('အအေး')
                          ? '🥤'
                          : '📦'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold text-amber-500/70 truncate">
                      {product.category.split('(')[0].trim()}
                    </span>
                    <span className="text-[9px] text-amber-400 font-mono">
                      {product.stock} ခု
                    </span>
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-amber-200 group-hover:text-amber-300 line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-500/15 flex items-center justify-between">
                  <span className="font-orbitron font-bold text-xs text-amber-400">
                    {formatPrice(product.price, currency)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-black flex items-center justify-center font-bold text-xs transition-colors">
                    +
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Main Simplified 2-Column Register Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Simplified Current Cart Items (7 cols) */}
        <div className="lg:col-span-7 bg-[#0d0f16] border border-amber-500/30 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-amber-200 uppercase">
                {t.simplifiedOrderTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                {totalUnits}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => {
                  soundFX.playWarning();
                  if (window.confirm(t.clearConfirm)) {
                    onClearCart();
                  }
                }}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-900/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {t.clear}
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px] pr-1">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-amber-500/20 rounded-xl bg-black/30">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400/60 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-orbitron font-bold text-sm text-amber-200">
                  {t.emptyTrayTitle}
                </h4>
                <p className="text-xs text-amber-400/60 max-w-sm mt-1">
                  {t.emptyTrayDesc}
                </p>
                <button
                  onClick={() => onAddProduct(popularAssets[0])}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 cursor-pointer"
                >
                  + Add Sample Item ({popularAssets[0]?.name})
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-[#131620] border border-amber-500/20 hover:border-amber-400/50 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-amber-500/60 uppercase">
                        {item.product.sku}
                      </span>
                      {item.product.purity && (
                        <span className="text-[9px] px-1.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {item.product.purity}
                        </span>
                      )}
                    </div>
                    <div className="font-orbitron font-bold text-xs sm:text-sm text-amber-100 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-amber-400/80 font-mono mt-0.5">
                      ${item.product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} ea
                    </div>
                  </div>

                  {/* Quantity Controls (Large, high-contrast touch buttons) */}
                  <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/30 p-1 rounded-xl shrink-0">
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        onUpdateQuantity(item.product.id, -1);
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-orbitron font-bold text-sm text-amber-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        onUpdateQuantity(item.product.id, 1);
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total & Remove */}
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="font-orbitron font-bold text-sm text-amber-300">
                      {formatPrice(item.product.price * item.quantity, currency)}
                    </div>
                    <button
                      onClick={() => {
                        soundFX.playWarning();
                        onRemoveItem(item.product.id);
                      }}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                      title={t.removeTooltip}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Simplified Order Summary & Checkout Box (5 cols) */}
        <div className="lg:col-span-5 bg-[#0d0f16] border-2 border-amber-500/40 rounded-2xl p-5 shadow-[0_4px_35px_rgba(245,183,0,0.15)] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-amber-300 uppercase">
                {t.orderSummaryTitle}
              </h3>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                {currency === 'MMK' ? 'MMK (မြန်မာကျပ်)' : 'USD ($)'}
              </span>
            </div>

            {/* Price Breakdown Boxes */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-300 p-2 bg-black/40 rounded-lg border border-amber-500/10">
                <span>{t.subtotal}:</span>
                <span className="font-orbitron font-bold text-amber-200">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-400 p-2 bg-emerald-950/15 rounded-lg border border-emerald-900/30">
                <span>{t.discount} ({Math.round(effectiveDiscountRate * 100)}%):</span>
                <span className="font-orbitron font-bold">
                  -{formatPrice(discountAmount, currency)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400 p-2 bg-black/40 rounded-lg border border-amber-500/10">
                <span>{t.luxuryVat} (Tax):</span>
                <span className="font-orbitron text-amber-300/80">
                  +{formatPrice(taxAmount, currency)}
                </span>
              </div>
            </div>

            {/* Client VIP & Discount Quick Triggers */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  soundFX.playClick();
                  onOpenLoyaltyModal();
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeLoyalty
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.2)]'
                    : 'bg-neutral-900/60 text-amber-400/70 border-amber-500/30 hover:border-amber-400 hover:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>{activeLoyalty ? activeLoyalty.tier : t.loyaltyCardBtn}</span>
                </div>
                {activeLoyalty && (
                  <span className="text-[10px] text-amber-300/90 font-mono">
                    {activeLoyalty.name} · {Math.round(activeLoyalty.discountRate * 100)}% off
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onOpenDiscountModal();
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  discountPercent > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.2)]'
                    : 'bg-neutral-900/60 text-amber-400/70 border-amber-500/30 hover:border-amber-400 hover:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>{t.applyDiscountBtn}</span>
                </div>
                {discountPercent > 0 && (
                  <span className="text-[10px] text-amber-300/90 font-mono">
                    {discountPercent}% Active
                  </span>
                )}
              </button>
            </div>

            {/* Prominent Net Payable Box */}
            <div className="bg-gradient-to-br from-amber-500/20 via-black to-neutral-950 border-2 border-amber-400/60 rounded-2xl p-4 shadow-[0_0_25px_rgba(245,183,0,0.25)] text-center">
              <span className="text-[11px] font-mono text-amber-400/80 uppercase tracking-widest block">
                {t.netPayable}
              </span>
              <span className="font-orbitron font-extrabold text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_12px_rgba(245,183,0,0.5)] block mt-1">
                {formatPrice(grandTotal, currency)}
              </span>
            </div>
          </div>

          {/* Big High-Impact Checkout Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                soundFX.playGoldChime();
                onInitiateCheckout();
              }}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-xl font-orbitron font-extrabold text-sm sm:text-base tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                cart.length > 0
                  ? 'btn-gold-ripple bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black shadow-[0_0_30px_rgba(245,183,0,0.6)] hover:brightness-110 active:scale-[0.99]'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t.checkoutBtn}</span>
              {cart.length > 0 && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded bg-black/30 text-amber-100 font-mono">
                  {formatPrice(grandTotal, currency)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Burma Batik Sponsor Banner */}
      <div className="mt-8 pt-4 border-t border-amber-500/20 text-center flex flex-col items-center justify-center">
        <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border border-amber-400/40 text-amber-200 font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(245,183,0,0.25)] flex items-center gap-2 animate-pulse">
          <span className="text-amber-400">✨</span>
          <span>ဘားမားပါတိတ်မှ ပံ့ပိုးကူညီသည် ဘားမားပါတိတ်ဝတ်ဖူးလား?</span>
          <span className="text-amber-400">✨</span>
        </div>
      </div>
    </div>
  );
};
