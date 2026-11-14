import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CartItem, CompletedSale, LoyaltyMember, PaymentMethod } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface PaymentModalProps {
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  loyaltyMember: LoyaltyMember | null;
  onClose: () => void;
  onPaymentSuccess: (sale: CompletedSale) => void;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  cart,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  loyaltyMember,
  onClose,
  onPaymentSuccess,
  currency,
  t,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [tenderAmount, setTenderAmount] = useState<number>(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const changeDue = Math.max(0, tenderAmount - total);

  // Bill presets for cash payment
  const cashPresets =
    currency === 'MMK'
      ? [1000, 5000, 10000, 20000, 50000, 100000]
      : [20, 50, 100, 200, 500, 1000];

  const handleProcessPayment = () => {
    setIsProcessing(true);
    soundFX.playClick();

    setTimeout(() => {
      setIsProcessing(false);
      setIsAuthorized(true);
      soundFX.playGoldChime();

      // Trigger celebratory gold confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#d97706', '#fef08a'],
        });
      } catch {
        // fallback
      }

      setTimeout(() => {
        const completedSale: CompletedSale = {
          id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          items: [...cart],
          subtotal,
          discountAmount,
          taxAmount,
          total,
          paymentMethod: selectedMethod,
          loyaltyMember,
          cashierName: 'Cashier Staff',
          registerId: 'REG-01',
        };
        onPaymentSuccess(completedSale);
      }, 900);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-[#0f111a] border border-amber-500/40 rounded-2xl max-w-xl w-full shadow-[0_0_50px_rgba(245,183,0,0.35)] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/20 bg-gradient-to-r from-[#141624] to-[#0d0e17]">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-amber-500 uppercase">
              {t.secureVault} · ငွေချေစနစ်
            </span>
            <h3 className="font-orbitron font-bold text-lg text-amber-200 tracking-wide">
              {t.paymentSettlement}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-amber-500/80">{t.amountDue}</span>
            <div className="text-xl font-mono tabular-nums font-extrabold text-amber-300 gold-outline-text">
              {formatPrice(total, currency)}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-mono text-amber-400 mb-2.5 uppercase tracking-wider">
              {t.selectTerminal} (Select Payment Method)
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {/* Cash Button */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setSelectedMethod('cash');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,183,0,0.3)]'
                    : 'bg-black/40 border-amber-500/20 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40'
                }`}
              >
                <span className="text-lg">💵</span>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {t.cashTender} (Cash)
                </span>
              </button>

              {/* Mobile Pay (KPay / WavePay) Button */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setSelectedMethod('mobile');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'mobile'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,183,0,0.3)]'
                    : 'bg-black/40 border-amber-500/20 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40'
                }`}
              >
                <span className="text-lg">📱</span>
                <span className="text-xs font-semibold whitespace-nowrap">
                  KPay / WavePay
                </span>
              </button>

              {/* Credit / Debit Card Button */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setSelectedMethod('card');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,183,0,0.3)]'
                    : 'bg-black/40 border-amber-500/20 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40'
                }`}
              >
                <span className="text-lg">💳</span>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {t.creditCard} (Card)
                </span>
              </button>

              {/* Bank Transfer / Mobile Banking Button */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setSelectedMethod('bank_transfer');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'bank_transfer'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,183,0,0.3)]'
                    : 'bg-black/40 border-amber-500/20 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40'
                }`}
              >
                <span className="text-lg">🏦</span>
                <span className="text-xs font-semibold whitespace-nowrap">
                  ဘဏ်လွှဲ / Transfer
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Method View */}
          {selectedMethod === 'cash' && (
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400">{t.cashReceived}</span>
                <span className="text-xs font-mono text-amber-300/80">
                  {t.exact}: {formatPrice(total, currency)}
                </span>
              </div>
              <input
                type="number"
                min={total}
                value={tenderAmount}
                onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141624] border border-amber-500/40 rounded-xl px-4 py-2.5 font-mono text-lg text-amber-100 font-bold focus:outline-none focus:border-amber-300"
              />

              {/* Quick Bill presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-neutral-400">{t.presets}</span>
                <button
                  type="button"
                  onClick={() => setTenderAmount(total)}
                  className="px-2.5 py-1 text-xs rounded bg-neutral-900 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                >
                  {t.exact} ({formatPrice(total, currency)})
                </button>
                {cashPresets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTenderAmount(amt)}
                    className="px-2.5 py-1 text-xs rounded bg-neutral-900 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-mono cursor-pointer"
                  >
                    {formatPrice(amt, currency)}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-neutral-900 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-orbitron font-semibold text-amber-300 uppercase block">
                    {t.changeDue} (Change Return)
                  </span>
                  <span className="text-[10px] text-amber-500/70 font-mono">
                    {formatPrice(tenderAmount, currency)} - {formatPrice(total, currency)}
                  </span>
                </div>
                <span className="text-xl font-mono font-extrabold text-amber-200">
                  {formatPrice(changeDue, currency)}
                </span>
              </div>
            </div>
          )}

          {selectedMethod === 'mobile' && (
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30 space-y-3 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-amber-500/10 border border-amber-400/50 flex items-center justify-center text-2xl">
                📱
              </div>
              <div className="text-sm font-semibold text-amber-200">
                KBZPay / WavePay QR စနစ်ဖြင့် ငွေလက်ခံနိုင်ပါသည်
              </div>
              <p className="text-xs text-amber-400/70 font-mono">
                ငွေလွှဲပြေစာ စစ်ဆေးပြီးပါက အောက်ပါ &apos;ငွေပေးချေမှု အတည်ပြုရန်&apos; ခလုတ်ကို နှိပ်ပါ။
              </p>
              <div className="text-lg font-mono font-bold text-amber-300 py-1">
                ကျသင့်ငွေ: {formatPrice(total, currency)}
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30 space-y-3 text-center">
              <div className="text-sm font-semibold text-amber-200">
                POS Terminal ကတ်ဖြတ်စက်ဖြင့် ငွေလက်ခံရန် အသင့်ဖြစ်ပါသည်
              </div>
              <p className="text-xs text-amber-400/70 font-mono">
                {t.emvTerminalReady} · {t.chipPinEncrypted}
              </p>
              <div className="text-lg font-mono font-bold text-amber-300 py-1">
                {formatPrice(total, currency)}
              </div>
            </div>
          )}

          {selectedMethod === 'bank_transfer' && (
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30 space-y-3 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-amber-500/10 border border-amber-400/50 flex items-center justify-center text-2xl">
                🏦
              </div>
              <div className="text-sm font-semibold text-amber-200">
                KBZ, CB, AYA သို့မဟုတ် အခြား မိုဘိုင်းဘဏ်စနစ်ဖြင့် တိုက်ရိုက် ငွေလွှဲလက်ခံနိုင်ပါသည်
              </div>
              <p className="text-xs text-amber-400/70 font-mono">
                ဖောက်သည်ထံမှ ဘဏ်ငွေလွှဲပြေစာ အတည်ပြုပြီးပါက အောက်ပါ &apos;ငွေပေးချေမှု အတည်ပြုရန်&apos; ခလုတ်ကို နှိပ်ပါ။
              </p>
              <div className="text-lg font-mono font-bold text-amber-300 py-1">
                ကျသင့်ငွေ: {formatPrice(total, currency)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gradient-to-r from-[#141624] to-[#0d0e17] border-t border-amber-500/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={isProcessing || isAuthorized}
            className="btn-gold-ripple px-8 py-3 rounded-xl font-orbitron font-extrabold text-xs sm:text-sm tracking-wider uppercase text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_20px_rgba(245,183,0,0.4)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? 'အတည်ပြုနေပါသည်...' : isAuthorized ? 'အတည်ပြုပြီးပါပြီ ✓' : 'ငွေပေးချေမှု အတည်ပြုရန် (Authorize)'}
          </button>
        </div>
      </div>
    </div>
  );
};
