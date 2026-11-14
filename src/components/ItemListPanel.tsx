import React, { useState } from 'react';
import { CartItem, Product } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface ItemListPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenManualEntry: () => void;
  onOpenQuickItem: () => void;
  availableProducts: Product[];
  onAddProduct: (product: Product) => void;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const ItemListPanel: React.FC<ItemListPanelProps> = ({
  cart,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onClearCart,
  onOpenManualEntry,
  onOpenQuickItem,
  availableProducts,
  onAddProduct,
  currency,
  t,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatalogQuickAdd, setShowCatalogQuickAdd] = useState(false);

  const filteredCatalog = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full bg-[#0b0d13]/95 rounded-2xl border border-amber-500/25 p-4 sm:p-5 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      {/* Header with Title and Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
          <div>
            <h2 className="font-orbitron font-extrabold text-xs sm:text-sm tracking-wider text-amber-200 uppercase">
              {t.transactionItems}
            </h2>
            <div className="text-xs text-amber-500/70 font-mono">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} {t.unitsInRegister}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Custom Item Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenQuickItem();
            }}
            className="btn-gold-ripple px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-sm"
            title="Add any custom item or price directly to bill"
          >
            <span>⚡</span>
            <span>အမြန်ရောင်း (Quick Item)</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setShowCatalogQuickAdd(!showCatalogQuickAdd);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
              showCatalogQuickAdd
                ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_10px_rgba(245,183,0,0.25)]'
                : 'bg-neutral-900/80 text-amber-300/80 border-amber-500/30 hover:border-amber-400'
            }`}
          >
            {showCatalogQuickAdd ? t.hideCatalog : t.quickAddItem}
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onOpenManualEntry();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-amber-300/80 bg-neutral-900/80 border border-amber-500/30 rounded-xl hover:bg-amber-500/10 hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.manualEntry}
          </button>

          {cart.length > 0 && (
            <button
              onClick={() => {
                soundFX.playWarning();
                if (window.confirm(t.clearConfirm)) {
                  onClearCart();
                }
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-400/80 hover:text-rose-300 bg-rose-950/20 border border-rose-900/40 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              title={t.clearConfirm}
            >
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Catalog Strip (collapsible) */}
      {showCatalogQuickAdd && (
        <div className="mt-3 p-3 bg-neutral-950/90 rounded-2xl border border-amber-500/30 space-y-3 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-amber-400/90 font-bold">{t.vaultShowcase}</span>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#10121a] border border-amber-500/30 rounded-xl px-3 py-1 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-300 w-56 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
            {filteredCatalog.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  soundFX.playScanBeep();
                  onAddProduct(product);
                }}
                className="flex items-center gap-2.5 text-left p-2.5 rounded-xl bg-[#0f111a] border border-amber-500/20 hover:border-amber-400/70 hover:bg-amber-500/10 transition-all text-xs group cursor-pointer shadow-sm"
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-amber-500/30 shrink-0 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">📦</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] text-amber-400/70 font-mono">
                    <span>{product.sku}</span>
                    <span className={product.stock <= 5 ? 'text-amber-400 font-bold' : 'text-amber-500/70'}>
                      {product.stock} in stock
                    </span>
                  </div>
                  <div className="font-semibold text-amber-100 group-hover:text-amber-300 truncate">
                    {product.name}
                  </div>
                  <div className="font-mono text-amber-300 text-xs font-bold">
                    {formatPrice(product.price, currency)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Items Scanned Table / List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2.5 min-h-[240px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-amber-500/20 rounded-2xl bg-black/25">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3.5 shadow-[0_0_20px_rgba(245,183,0,0.15)]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-orbitron text-sm font-bold text-amber-300 tracking-wide">
              {t.emptyTrayTitle}
            </h3>
            <p className="text-xs text-amber-500/70 max-w-sm mt-1.5 font-mono">
              {t.emptyTrayDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => {
              const lineTotal = item.product.price * item.quantity;
              const isLowStock = item.product.stock <= 5;

              return (
                <div
                  key={item.product.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#10121b]/95 border border-amber-500/25 hover:border-amber-400/50 transition-all gap-3 shadow-sm group"
                >
                  {/* Left: Product Info with Photo */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-amber-500/35 flex items-center justify-center shrink-0 shadow-sm">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-xl">
                          {item.product.category.includes('ပါတိတ်') || item.product.category.includes('အထည်')
                            ? '👗'
                            : item.product.category.includes('စားသောက်ကုန်')
                            ? '🥫'
                            : item.product.category.includes('အအေး')
                            ? '🥤'
                            : '📦'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-amber-100 text-sm truncate">
                          {item.product.name}
                        </span>
                        {item.product.purity && (
                          <span className="text-[10px] text-amber-400 font-mono tracking-wider">
                            · {item.product.purity}
                          </span>
                        )}
                        {/* Low stock visual indicator */}
                        {isLowStock && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,183,0,0.3)]">
                            ⚠️ လက်ကျန် {item.product.stock} ခု
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-500/70 font-mono mt-1 flex-wrap">
                        <span>SKU: {item.product.sku}</span>
                        <span>·</span>
                        <span>{t.unitPrice} {formatPrice(item.product.price, currency)}</span>
                        <span>·</span>
                        <span className="text-amber-400/80">Stock: {item.product.stock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Quantity adjust stepper */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <div className="flex items-center bg-black/70 border border-amber-500/30 rounded-xl p-0.5 shadow-inner">
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateQuantity(item.product.id, -1);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onSetQuantity(item.product.id, val);
                          }
                        }}
                        className="w-10 text-center bg-transparent text-amber-100 font-mono text-xs font-bold focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateQuantity(item.product.id, 1);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="w-28 text-right font-mono tabular-nums text-sm font-extrabold text-amber-300">
                      {formatPrice(lineTotal, currency)}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        soundFX.playWarning();
                        onRemoveItem(item.product.id);
                      }}
                      className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
                      title={t.removeTooltip}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
