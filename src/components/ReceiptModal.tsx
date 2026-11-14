import React from 'react';
import { CompletedSale } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface ReceiptModalProps {
  sale: CompletedSale;
  onClose: () => void;
  onNewTransaction: () => void;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  onClose,
  onNewTransaction,
  currency,
  t,
}) => {
  const handlePrint = () => {
    soundFX.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b0c11] border-2 border-amber-400/50 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(245,183,0,0.35)] overflow-hidden flex flex-col my-auto">
        {/* Top Gold Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 shadow-[0_0_15px_rgba(245,183,0,0.6)]" />

        <div className="p-6 space-y-4 text-amber-100 font-mono text-xs">
          {/* Brand & Store header */}
          <div className="text-center border-b border-dashed border-amber-500/30 pb-4">
            <h2 className="font-orbitron font-extrabold text-base tracking-widest text-amber-300 uppercase">
              {t.brandName}
            </h2>
            <p className="text-[10px] text-amber-500/80 mt-0.5">
              အရောင်းပြေစာ / Official Sales Receipt
            </p>
            <p className="text-[10px] text-amber-500/60 mt-0.5">
              တရားဝင် အရောင်းမှတ်တမ်း · KKS Cashier System
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-1 text-[11px] border-b border-dashed border-amber-500/30 pb-3">
            <div>
              <span className="text-amber-500/70">{t.receiptNumber}</span>{' '}
              <span className="text-amber-200 font-bold">{sale.id}</span>
            </div>
            <div className="text-right">
              <span className="text-amber-500/70">{t.time}</span>{' '}
              <span className="text-amber-200">{sale.timestamp}</span>
            </div>
            <div>
              <span className="text-amber-500/70">{t.cashier}</span>{' '}
              <span className="text-amber-200">{sale.cashierName}</span>
            </div>
            <div className="text-right">
              <span className="text-amber-500/70">{t.terminalLabel}</span>{' '}
              <span className="text-amber-200">{sale.registerId}</span>
            </div>
            {sale.loyaltyMember && (
              <div className="col-span-2 pt-1 text-amber-300">
                <span>VIP CLIENT: {sale.loyaltyMember.name} ({sale.loyaltyMember.tier})</span>
              </div>
            )}
          </div>

          {/* Items purchased */}
          <div className="space-y-2 border-b border-dashed border-amber-500/30 pb-4">
            <div className="flex justify-between text-amber-400 font-bold text-[10px] uppercase">
              <span>{t.itemSku}</span>
              <span className="text-right">{t.qtyPriceTotal}</span>
            </div>
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="max-w-[62%]">
                  <div className="font-semibold text-amber-100">{item.product.name}</div>
                  <div className="text-[10px] text-amber-500/70">{item.product.sku}</div>
                </div>
                <div className="text-right tabular-nums">
                  <div>
                    {item.quantity} × {formatPrice(item.product.price, currency)}
                  </div>
                  <div className="font-bold text-amber-300">
                    {formatPrice(item.quantity * item.product.price, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 border-b border-dashed border-amber-500/30 pb-3 text-[11px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-amber-500/80">{t.subtotal}</span>
              <span>{formatPrice(sale.subtotal, currency)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>{t.discount}</span>
                <span>-{formatPrice(sale.discountAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-amber-500/80">{t.luxuryVat} (Commercial Tax)</span>
              <span>{formatPrice(sale.taxAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-orbitron font-extrabold text-amber-300 pt-1 border-t border-amber-500/20">
              <span>{t.totalPaid}</span>
              <span className="gold-outline-text">
                {formatPrice(sale.total, currency)}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-amber-500/70 uppercase">
              <span>{t.settlementMethod}</span>
              <span className="font-semibold text-amber-300 uppercase">
                {sale.paymentMethod === 'mobile'
                  ? 'KPay / WavePay (မိုဘိုင်းပိုက်ဆံအိတ်)'
                  : sale.paymentMethod === 'bank_transfer'
                  ? 'ဘဏ်လွှဲ (Bank Transfer)'
                  : sale.paymentMethod === 'card'
                  ? 'ကတ် (Card POS)'
                  : 'ငွေသား (Cash)'}
              </span>
            </div>
          </div>

          {/* Barcode on receipt */}
          <div className="pt-2 text-center space-y-1">
            <div className="flex items-center justify-center gap-0.5 h-8 px-6">
              {[2, 4, 1, 3, 2, 5, 2, 4, 1, 3, 2, 6, 2, 1, 4, 3, 2, 5, 2, 4, 1, 3, 2, 4, 1, 3].map((w, i) => (
                <div
                  key={i}
                  className="bg-amber-300/80 h-full"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <div className="text-[10px] tracking-widest text-amber-500/70 font-mono">
              *{sale.id}*
            </div>
            <div className="text-[9px] text-amber-500/50 uppercase pt-1">
              {t.receiptThankYou}
            </div>
          </div>

          {/* Special Burma Batik Sponsor Showcase */}
          <div className="pt-2.5 border-t border-amber-500/20 text-center">
            <div className="py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-amber-500/10 border border-amber-400/35">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-amber-400 text-xs">✨</span>
                <span className="font-myanmar text-xs font-semibold">
                  <span className="text-amber-200">ဘားမားပါတိတ်မှ ပံ့ပိုးကူညီသည်</span>{' '}
                  <span className="text-yellow-300 font-bold">ဘားမားပါတိတ်ဝတ်ဖူးလား?</span>
                </span>
                <span className="text-amber-400 text-xs">✨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gradient-to-r from-[#141624] to-[#0d0e17] border-t border-amber-500/30 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-neutral-900 border border-amber-500/30 hover:border-amber-400 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{t.printReceipt}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              {t.close}
            </button>
            <button
              onClick={onNewTransaction}
              className="btn-gold-ripple px-5 py-2 rounded-xl font-orbitron font-bold text-xs tracking-wider uppercase text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_15px_rgba(245,183,0,0.4)] cursor-pointer"
            >
              {t.newSale}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
