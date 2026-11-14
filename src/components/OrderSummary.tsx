import React, { useState } from 'react';
import { CartItem, LoyaltyMember } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface OrderSummaryProps {
  cart: CartItem[];
  discountPercent: number;
  onApplyDiscount: (percent: number) => void;
  activeLoyalty: LoyaltyMember | null;
  onSelectLoyalty: (member: LoyaltyMember | null) => void;
  availableLoyaltyMembers: LoyaltyMember[];
  taxRate: number; // e.g. 0.05 (5%)
  onClearOrder: () => void;
  onInitiateCheckout: () => void;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cart,
  discountPercent,
  onApplyDiscount,
  activeLoyalty,
  onSelectLoyalty,
  availableLoyaltyMembers,
  taxRate,
  onClearOrder,
  onInitiateCheckout,
  currency,
  t,
}) => {
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [customDiscountInput, setCustomDiscountInput] = useState('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Total discount considers loyalty bonus + manual voucher discount
  const loyaltyRate = activeLoyalty ? activeLoyalty.discountRate : 0;
  const effectiveDiscountRate = Math.min(0.6, discountPercent / 100 + loyaltyRate);
  const discountAmount = subtotal * effectiveDiscountRate;

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;

  const hasItems = cart.length > 0;

  return (
    <div className="flex flex-col bg-[#0b0d13]/95 rounded-2xl border border-amber-500/30 p-4 sm:p-5 shadow-[0_4px_35px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
          <h2 className="font-orbitron font-extrabold text-xs sm:text-sm tracking-wider text-amber-300 uppercase">
            {t.orderSummaryTitle}
          </h2>
        </div>
        <span className="font-mono text-[11px] text-amber-400 font-bold">
          {currency === 'MMK' ? 'MMK (မြန်မာကျပ်)' : 'USD ($)'}
        </span>
      </div>

      {/* Gold-Framed Metric Boxes */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {/* Subtotal Box */}
        <div className="p-3 rounded-xl bg-gradient-to-b from-[#13151f] to-[#090b0e] border border-amber-500/20 flex flex-col shadow-inner">
          <span className="text-[11px] font-mono text-amber-500/80 uppercase">{t.subtotal}</span>
          <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-amber-100 mt-1">
            {formatPrice(subtotal, currency)}
          </span>
        </div>

        {/* Discount Box */}
        <div className="p-3 rounded-xl bg-gradient-to-b from-[#13151f] to-[#090b0e] border border-amber-500/20 flex flex-col shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-500/80 uppercase">{t.discount}</span>
            {effectiveDiscountRate > 0 && (
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                -{(effectiveDiscountRate * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-amber-300 mt-1">
            -{formatPrice(discountAmount, currency)}
          </span>
        </div>

        {/* Estimated Commercial Tax Box */}
        <div className="p-3 rounded-xl bg-gradient-to-b from-[#13151f] to-[#090b0e] border border-amber-500/20 flex flex-col shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-500/80 uppercase">{t.luxuryVat}</span>
            <span className="text-[10px] text-amber-500/60 font-mono">{(taxRate * 100).toFixed(0)}%</span>
          </div>
          <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-amber-200 mt-1">
            {formatPrice(taxAmount, currency)}
          </span>
        </div>

        {/* Grand Total Box (Prominent Gold Accent) */}
        <div className="p-3 rounded-xl bg-gradient-to-b from-amber-950/40 via-[#18150f] to-[#0b0a06] border-2 border-amber-400/60 shadow-[0_0_20px_rgba(245,183,0,0.3)] flex flex-col">
          <span className="text-[11px] font-orbitron text-amber-300 font-bold tracking-wide uppercase">
            {t.netPayable}
          </span>
          <span className="text-lg sm:text-xl font-mono tabular-nums font-extrabold text-amber-200 mt-1 gold-outline-text">
            {formatPrice(grandTotal, currency)}
          </span>
        </div>
      </div>

      {/* Applied Loyalty or Discount indicator */}
      {(activeLoyalty || discountPercent > 0) && (
        <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-200">
              {activeLoyalty ? `${activeLoyalty.name} (${activeLoyalty.tier})` : `Custom Promo (${discountPercent}%)`}
            </span>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              if (activeLoyalty) onSelectLoyalty(null);
              if (discountPercent > 0) onApplyDiscount(0);
            }}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
          >
            {t.reset}
          </button>
        </div>
      )}

      {/* Secondary Fast Action Buttons: Discount, Loyalty, Clear */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Apply Discount Button */}
        <button
          onClick={() => {
            soundFX.playClick();
            setShowDiscountModal(true);
          }}
          disabled={!hasItems}
          className="px-2 py-2 text-xs font-semibold text-amber-300/90 bg-neutral-900/80 border border-amber-500/30 rounded-xl hover:border-amber-400 hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all truncate cursor-pointer"
        >
          {discountPercent > 0 ? `${discountPercent}% Disc` : t.applyDiscountBtn}
        </button>

        {/* Loyalty Card Button */}
        <button
          onClick={() => {
            soundFX.playClick();
            setShowLoyaltyModal(true);
          }}
          className={`px-2 py-2 text-xs font-semibold rounded-xl border transition-all truncate cursor-pointer ${
            activeLoyalty
              ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.3)]'
              : 'text-amber-300/90 bg-neutral-900/80 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10'
          }`}
        >
          {activeLoyalty ? t.vipActive : t.loyaltyCardBtn}
        </button>

        {/* Clear Order */}
        <button
          onClick={() => {
            soundFX.playWarning();
            if (hasItems && window.confirm(t.clearConfirm)) {
              onClearOrder();
            }
          }}
          disabled={!hasItems}
          className="px-2 py-2 text-xs font-semibold text-rose-300/90 bg-rose-950/20 border border-rose-900/40 rounded-xl hover:bg-rose-900/30 hover:text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all truncate cursor-pointer"
        >
          {t.clearOrderBtn}
        </button>
      </div>

      {/* Checkout Button with Glowing Gold Ripple Effect */}
      <button
        onClick={() => {
          if (!hasItems) {
            soundFX.playWarning();
            return;
          }
          soundFX.playGoldChime();
          onInitiateCheckout();
        }}
        disabled={!hasItems}
        className={`btn-gold-ripple w-full py-3.5 px-4 rounded-xl font-orbitron font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
          hasItems
            ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-[0_0_30px_rgba(245,183,0,0.6)] border border-amber-100/70 hover:shadow-[0_0_40px_rgba(245,183,0,0.8)]'
            : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-50'
        }`}
        style={{
          animation: hasItems ? 'gold-ripple 3s infinite' : 'none',
        }}
      >
        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>{t.checkoutBtn}</span>
      </button>

      {/* Discount Selection Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#10121a] border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(245,183,0,0.3)]">
            <h3 className="font-orbitron font-bold text-amber-200 text-base mb-1">{t.applyPromoTitle}</h3>
            <p className="text-xs text-amber-500/70 font-mono mb-4">{t.applyPromoDesc}</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    soundFX.playClick();
                    onApplyDiscount(pct);
                    setShowDiscountModal(false);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    discountPercent === pct
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-neutral-900 text-amber-300 border-amber-500/30 hover:border-amber-400'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <input
                type="number"
                placeholder={t.customPercentPlaceholder}
                min="0"
                max="50"
                value={customDiscountInput}
                onChange={(e) => setCustomDiscountInput(e.target.value)}
                className="w-full bg-[#181b26] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => {
                  const val = parseFloat(customDiscountInput);
                  if (!isNaN(val) && val >= 0 && val <= 50) {
                    soundFX.playClick();
                    onApplyDiscount(val);
                    setShowDiscountModal(false);
                  }
                }}
                className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 whitespace-nowrap cursor-pointer"
              >
                {t.apply}
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  onApplyDiscount(0);
                  setShowDiscountModal(false);
                }}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                {t.removeDiscount}
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 text-xs bg-neutral-800 text-amber-200 rounded-lg hover:bg-neutral-700 cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Card Modal */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#10121a] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(245,183,0,0.3)]">
            <h3 className="font-orbitron font-bold text-amber-200 text-base mb-1">{t.loyaltyRegistryTitle}</h3>
            <p className="text-xs text-amber-500/70 font-mono mb-4">{t.loyaltySelectSubtitle}</p>

            <div className="space-y-2 mb-5">
              {availableLoyaltyMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => {
                    soundFX.playScanBeep();
                    onSelectLoyalty(member);
                    setShowLoyaltyModal(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    activeLoyalty?.id === member.id
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,183,0,0.25)]'
                      : 'bg-neutral-900/70 border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-500/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-100 text-sm">{member.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/30">
                        {member.tier}
                      </span>
                    </div>
                    <div className="text-xs text-amber-500/70 font-mono mt-0.5">
                      Card ID: {member.id} · Points: {member.points.toLocaleString()} pts
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      -{(member.discountRate * 100).toFixed(0)}% VIP
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              {activeLoyalty && (
                <button
                  onClick={() => {
                    onSelectLoyalty(null);
                    setShowLoyaltyModal(false);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  {t.detachMember}
                </button>
              )}
              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="ml-auto px-4 py-2 text-xs bg-neutral-800 text-amber-200 rounded-lg hover:bg-neutral-700 cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
