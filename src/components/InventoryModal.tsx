import React, { useState } from 'react';
import { Product } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface InventoryModalProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onOpenAddNew: () => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onClearAllProducts?: () => void;
  onLoadSampleProducts?: () => void;
  onClose: () => void;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  products,
  onAddProduct,
  onOpenAddNew,
  onDeleteProduct,
  onUpdateStock,
  onClearAllProducts,
  onLoadSampleProducts,
  onClose,
  currency,
  t,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [customStockVal, setCustomStockVal] = useState<string>('');

  // User-defined low-stock warning threshold (stored in localStorage)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kks_low_stock_threshold');
      return saved ? parseInt(saved, 10) || 5 : 5;
    } catch {
      return 5;
    }
  });

  // Toggle filter to isolate low stock / out of stock items
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Collect unique categories dynamically
  const existingCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const categories = ['All', ...existingCategories];

  // Count low stock items based on user-defined threshold
  const lowStockItems = products.filter((p) => p.stock <= lowStockThreshold);
  const lowStockCount = lowStockItems.length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchesLowStock = !showLowStockOnly || p.stock <= lowStockThreshold;
    return matchesCat && matchesSearch && matchesLowStock;
  });

  const handleStockSave = (productId: string) => {
    const parsed = parseInt(customStockVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      soundFX.playClick();
      onUpdateStock(productId, parsed);
    }
    setEditingStockId(null);
  };

  const handleThresholdChange = (newVal: number) => {
    const safeVal = Math.max(1, Math.min(999, newVal));
    setLowStockThreshold(safeVal);
    try {
      localStorage.setItem('kks_low_stock_threshold', safeVal.toString());
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0c0e15] border-2 border-amber-500/40 rounded-2xl max-w-5xl w-full shadow-[0_0_60px_rgba(245,183,0,0.3)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-amber-500/25 bg-gradient-to-r from-[#161827] to-[#0c0e15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-widest text-amber-500 uppercase">
                Cloud Inventory & Product Manager
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="font-orbitron font-extrabold text-base sm:text-lg text-amber-200 uppercase">
                  {t.stockRepoTitle} ({products.length})
                </h2>
                {lowStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <span>⚠️</span>
                    <span>{lowStockCount} Low</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenAddNew();
              }}
              className="btn-gold-ripple px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,183,0,0.3)] hover:brightness-110 cursor-pointer"
            >
              <span>+</span>
              <span>ပစ္စည်းအသစ်ထည့်ရန် (Add Product)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="p-4 border-b border-amber-500/20 bg-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundFX.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,183,0,0.4)]'
                    : 'text-amber-400/70 hover:text-amber-200 hover:bg-amber-500/10'
                }`}
              >
                {cat === 'All' ? t.categoryFilterAll : cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="ရှာဖွေရန် / Search name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141624] border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 w-full sm:w-72 font-mono"
            />
          </div>
        </div>

        {/* User-Defined Low-Stock Warning Threshold & Filter Bar */}
        <div className="px-4 py-2.5 bg-black/60 border-b border-amber-500/15 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Low-Stock Threshold Setting */}
            <div className="flex items-center gap-2 bg-[#12141f] px-3 py-1.5 rounded-xl border border-amber-500/30">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>လက်ကျန်နည်း သတိပေး သတ်မှတ်ချက် (Low-Stock Alert Threshold):</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={lowStockThreshold}
                  onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 1)}
                  className="w-14 bg-black border border-amber-400/60 rounded px-2 py-0.5 text-xs text-amber-200 font-bold text-center focus:outline-none focus:border-amber-300"
                  title="Enter remaining quantity threshold"
                />
                <span className="text-amber-500/80">ခု</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-amber-500/20">
                {[3, 5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      handleThresholdChange(preset);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                      lowStockThreshold === preset
                        ? 'bg-amber-400 text-black font-bold border-amber-300'
                        : 'bg-neutral-900 border-amber-500/20 text-neutral-400 hover:text-amber-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filter: Show Low Stock Only */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowLowStockOnly(!showLowStockOnly);
              }}
              className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showLowStockOnly
                  ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.35)]'
                  : lowStockCount > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${lowStockCount > 0 ? 'bg-rose-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span>
                {showLowStockOnly ? 'အားလုံး ပြန်ပြမည်' : `လက်ကျန်နည်း ပစ္စည်းများသာ (${lowStockCount})`}
              </span>
            </button>
          </div>

          {/* Alert Status Banner */}
          {lowStockCount > 0 ? (
            <div className="text-[11px] text-amber-300 flex items-center gap-1.5 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-500/35">
              <span>🔔</span>
              <span>
                လက်ကျန် <strong className="text-amber-200">{lowStockThreshold} ခု</strong> အောက်ရှိသော ပစ္စည်း{' '}
                <strong className="text-amber-300">{lowStockCount} မျိုး</strong> ရှိနေပါသည်
                {outOfStockCount > 0 && (
                  <span className="text-rose-400 ml-1 font-bold">({outOfStockCount} မျိုး ပြတ်နေသည်)</span>
                )}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <span>✓</span>
              <span>လက်ကျန် အားလုံး လုံလောက်ပါသည် (All items above {lowStockThreshold} units)</span>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-full py-14 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-amber-500/30 bg-black/40">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 text-3xl mb-3 shadow-[0_0_20px_rgba(245,183,0,0.2)]">
                📦
              </div>
              <h3 className="text-base font-orbitron font-bold text-amber-200 uppercase">
                {products.length === 0
                  ? 'ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ (No Products Registered)'
                  : showLowStockOnly
                  ? `လက်ကျန် ${lowStockThreshold} ခုအောက် နည်းနေသော ပစ္စည်း မရှိပါ (No Low Stock Items)`
                  : 'ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမရှိပါ'}
              </h3>
              <p className="text-xs text-amber-500/70 font-mono mt-1.5 max-w-md">
                {products.length === 0
                  ? 'သင့်လုပ်ငန်းတွင် ရောင်းချမည့် ပစ္စည်းများကို အောက်ပါခလုတ်ဖြင့် စတင်ထည့်သွင်းပါ'
                  : showLowStockOnly
                  ? 'သတ်မှတ်ထားသော ပမာဏအောက် ပစ္စည်းမရှိပါ သို့မဟုတ် အထက်ပါ သတ်မှတ်ချက်ကို တိုးမြှင့်ကြည့်ပါ'
                  : 'အခြားအမည် သို့မဟုတ် Barcode ဖြင့် ပြန်လည်ရှာဖွေကြည့်ပါ'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {showLowStockOnly ? (
                  <button
                    onClick={() => setShowLowStockOnly(false)}
                    className="btn-gold-ripple px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(245,183,0,0.4)] cursor-pointer"
                  >
                    ပစ္စည်းအားလုံး ပြန်ကြည့်မည်
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        onOpenAddNew();
                      }}
                      className="btn-gold-ripple px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(245,183,0,0.4)] cursor-pointer"
                    >
                      <span>+</span>
                      <span>ပစ္စည်းအသစ်ထည့်မည် (Add New Product)</span>
                    </button>
                    {onLoadSampleProducts && products.length === 0 && (
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onLoadSampleProducts();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-amber-500/30 text-amber-300 hover:border-amber-400 text-xs font-mono"
                      >
                        နမူနာပစ္စည်းများ စမ်းသပ်ထည့်မည်
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {filtered.map((prod) => {
            const isOutOfStock = prod.stock <= 0;
            const isLowStock = !isOutOfStock && prod.stock <= lowStockThreshold;

            return (
              <div
                key={prod.id}
                className={`p-4 rounded-xl transition-all flex flex-col justify-between group shadow-sm ${
                  isOutOfStock
                    ? 'bg-gradient-to-b from-rose-950/25 via-[#131118] to-[#12141c] border-2 border-rose-500/70 shadow-[0_0_22px_rgba(244,63,94,0.22)]'
                    : isLowStock
                    ? 'bg-gradient-to-b from-amber-950/30 via-[#161418] to-[#12141c] border-2 border-amber-400/70 shadow-[0_0_20px_rgba(245,183,0,0.22)]'
                    : 'bg-[#12141c] border border-amber-500/25 hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(245,183,0,0.15)]'
                }`}
              >
                <div>
                  {/* Product Photo Thumbnail with Visual Warning Overlay */}
                  <div className={`relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-black/60 mb-3 flex items-center justify-center transition-colors border ${
                    isOutOfStock
                      ? 'border-rose-500/60'
                      : isLowStock
                      ? 'border-amber-400/60'
                      : 'border-amber-500/20 group-hover:border-amber-400/50'
                  }`}>
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          isOutOfStock ? 'opacity-60 grayscale-[40%]' : ''
                        }`}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-amber-500/50">
                        <span className="text-3xl">
                          {prod.category.includes('ပါတိတ်') || prod.category.includes('အထည်')
                            ? '👗'
                            : prod.category.includes('စားသောက်ကုန်')
                            ? '🥫'
                            : prod.category.includes('အအေး')
                            ? '🥤'
                            : prod.category.includes('အလှကုန်')
                            ? '💄'
                            : prod.category.includes('အီလက်ထရောနစ်')
                            ? '📱'
                            : '📦'}
                        </span>
                        <span className="text-[10px] font-mono mt-1 text-amber-500/60 uppercase">
                          {prod.category.split('(')[0].trim()}
                        </span>
                      </div>
                    )}

                    {/* Low-Stock / Out-of-Stock Visual Warning Badge */}
                    {isOutOfStock ? (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-rose-600/95 text-white font-extrabold text-[10px] tracking-wide shadow-[0_0_12px_rgba(225,29,72,0.8)] animate-pulse flex items-center gap-1 backdrop-blur-sm">
                        <span>🚨</span>
                        <span>OUT OF STOCK (ပစ္စည်းပြတ်နေသည်)</span>
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-amber-400 text-black font-extrabold text-[10px] tracking-wide shadow-[0_0_12px_rgba(245,183,0,0.7)] flex items-center gap-1 backdrop-blur-sm">
                        <span>⚠️</span>
                        <span>LOW STOCK ({prod.stock} ခုကျန်)</span>
                      </div>
                    ) : null}

                    {prod.badge && (
                      <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-amber-300 font-semibold border border-amber-500/30 text-[10px] backdrop-blur-sm">
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/80 mb-1">
                    <span className="font-bold text-amber-300">{prod.sku}</span>
                    <span className="text-amber-500/70 text-[10px] truncate max-w-[130px]">{prod.category}</span>
                  </div>

                  <h3 className="font-semibold text-amber-100 text-sm group-hover:text-amber-300 transition-colors line-clamp-2">
                    {prod.name}
                  </h3>

                  <p className="text-xs text-amber-500/70 font-mono mt-1 line-clamp-2">
                    {prod.description}
                  </p>

                  {/* Stock Management & Barcode */}
                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-mono ${
                    isOutOfStock
                      ? 'border-rose-500/30'
                      : isLowStock
                      ? 'border-amber-400/30'
                      : 'border-amber-500/15'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className={isOutOfStock ? 'text-rose-400 font-bold' : isLowStock ? 'text-amber-300 font-bold' : 'text-amber-500/70'}>
                        Stock:
                      </span>
                      {editingStockId === prod.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={customStockVal}
                            onChange={(e) => setCustomStockVal(e.target.value)}
                            className="w-16 bg-black border border-amber-400 rounded px-1.5 py-0.5 text-xs text-amber-200 text-center font-bold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleStockSave(prod.id)}
                            className="px-1.5 py-0.5 bg-emerald-500 text-black text-[10px] font-bold rounded cursor-pointer"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingStockId(prod.id);
                            setCustomStockVal(prod.stock.toString());
                          }}
                          className={`cursor-pointer px-2 py-0.5 rounded transition-all ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 font-bold animate-pulse'
                              : isLowStock
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/70 font-bold'
                              : 'font-bold text-amber-300 hover:underline'
                          }`}
                          title="Click to edit stock quantity"
                        >
                          {prod.stock} units ✎
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateStock(prod.id, prod.stock + 5);
                        }}
                        className="px-1.5 py-0.5 rounded bg-neutral-900 border border-amber-500/20 text-[10px] text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                        title="Quick Restock +5"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateStock(prod.id, prod.stock + 10);
                        }}
                        className={`px-1.5 py-0.5 rounded border text-[10px] cursor-pointer transition-colors ${
                          isOutOfStock || isLowStock
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
                            : 'bg-neutral-900 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                        }`}
                        title="Quick Restock +10"
                      >
                        +10
                      </button>
                      {(isOutOfStock || isLowStock) && (
                        <button
                          onClick={() => {
                            soundFX.playClick();
                            onUpdateStock(prod.id, prod.stock + 25);
                          }}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                          title="Quick Restock +25"
                        >
                          +25
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-500 mt-1">
                    Barcode: {prod.barcode}
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div className="pt-3 mt-3 border-t border-amber-500/15 flex items-center justify-between gap-2">
                  <div className="text-base font-mono tabular-nums font-bold text-amber-200">
                    {formatPrice(prod.price, currency)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${prod.name}" from inventory?`)) {
                          soundFX.playWarning();
                          onDeleteProduct(prod.id);
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded border border-rose-900/40 text-[11px] cursor-pointer"
                      title="Delete item from inventory"
                    >
                      🗑
                    </button>

                    <button
                      onClick={() => {
                        soundFX.playScanBeep();
                        onAddProduct(prod);
                      }}
                      className={`btn-gold-ripple px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        isOutOfStock
                          ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          : 'text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:shadow-[0_0_15px_rgba(245,183,0,0.4)]'
                      }`}
                    >
                      {t.addToSale}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-r from-[#141624] to-[#0c0e15] border-t border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-amber-500/70">
              {t.totalVaultItems} {filtered.length} Displayed
            </span>
            {products.length > 0 && onClearAllProducts && (
              <button
                onClick={() => {
                  if (window.confirm('သတိပေးချက်: စတိုးဆိုင်ရှိ ကုန်ပစ္စည်းစာရင်း အားလုံးကို အပြီးတိုင် ဖျက်ပစ်မှာ သေချာပါသလား?')) {
                    soundFX.playWarning();
                    onClearAllProducts();
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition-colors cursor-pointer"
                title="Clear all products from cloud catalog"
              >
                🗑 စာရင်းအားလုံးဖျက်မည် (Clear All)
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenAddNew();
              }}
              className="px-4 py-2 rounded-xl text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 cursor-pointer"
            >
              + ပစ္စည်းအသစ် ထည့်သွင်းရန်
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs bg-neutral-800 text-amber-200 hover:bg-neutral-700 cursor-pointer"
            >
              {t.closeVault}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
