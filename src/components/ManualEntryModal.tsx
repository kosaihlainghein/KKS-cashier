import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { saveProductToCloud } from '../services/posSyncService';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface ManualEntryModalProps {
  onAddManualProduct: (product: Product) => void;
  onClose: () => void;
  initialBarcode?: string;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  onAddManualProduct,
  onClose,
  initialBarcode,
  currency,
  t,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [barcode, setBarcode] = useState(
    initialBarcode || `${Math.floor(885000000000 + Math.random() * 999999999)}`
  );
  const [category, setCategory] = useState('ပါတိတ် / အထည် (Batik & Apparel)');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [purity, setPurity] = useState('စစ်စစ် (Original)');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  const handleGenerateBarcode = () => {
    soundFX.playClick();
    setBarcode(`${Math.floor(885000000000 + Math.random() * 999999999)}`);
  };

  // Convert uploaded image to lightweight compressed Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 380;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImage(dataUrl);
          soundFX.playClick();
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    const numStock = parseInt(stock, 10);
    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) {
      soundFX.playWarning();
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim(),
      name: name.trim(),
      category,
      price: numPrice,
      stock: isNaN(numStock) || numStock < 0 ? 0 : numStock,
      badge: 'New Item',
      purity: purity.trim(),
      description: description.trim() || 'စတိုးဆိုင် ပစ္စည်းအသစ်။',
      image: image.trim(),
    };

    soundFX.playScanBeep();
    // Save to shared cloud database for all devices
    await saveProductToCloud(newProduct);
    onAddManualProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-[#10121a] border-2 border-amber-500/40 rounded-2xl max-w-xl w-full shadow-[0_0_50px_rgba(245,183,0,0.35)] overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/25 bg-gradient-to-r from-[#161826] to-[#0c0e15] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <div>
              <h3 className="font-orbitron font-bold text-sm sm:text-base tracking-wider text-amber-200 uppercase">
                {t.manualEntryTitle}
              </h3>
              <p className="text-[11px] font-mono text-amber-400/70">
                ပစ္စည်းအသစ် ကတ်တလောက်ထဲ ထည့်သွင်းခြင်း
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30">
            SYNC TO ALL TERMINALS
          </span>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Product Image / Photo Upload (ပုံနှင့်တကွ) */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-amber-300 uppercase font-semibold flex items-center gap-1.5">
                <span>📸</span>
                <span>ပစ္စည်းဓာတ်ပုံ (Product Photo)</span>
              </label>
              <button
                type="button"
                onClick={() => setImageUrlInput(!imageUrlInput)}
                className="text-[11px] font-mono text-amber-400/80 hover:text-amber-200 hover:underline"
              >
                {imageUrlInput ? 'ဖိုင်ရွေးမည် (Upload File)' : 'ပုံလင့်ခ် ထည့်မည် (Image URL)'}
              </button>
            </div>

            {imageUrlInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/item-photo.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="flex-1 bg-[#181a24] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="px-2.5 py-2 bg-rose-950/50 text-rose-300 border border-rose-800/40 rounded-xl text-xs hover:bg-rose-900/50"
                  >
                    ဖျက်မည်
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {image ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,183,0,0.3)]">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-rose-700"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-400 transition-all flex flex-col items-center justify-center text-amber-400 cursor-pointer shrink-0"
                  >
                    <span className="text-xl">📷</span>
                    <span className="text-[9px] font-mono mt-1">ပုံတင်မည်</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-gold-ripple w-full py-2 px-3 rounded-xl bg-neutral-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>📁</span>
                    <span>ဖုန်း/ကွန်ပျူတာမှ ဓာတ်ပုံရွေးမည် (Choose Photo)</span>
                  </button>

                  <div className="text-[10px] text-amber-500/60 font-mono">
                    JPG, PNG သို့မဟုတ် ဖုန်းကင်မရာဖြင့် ရိုက်ကူးတင်သွင်းနိုင်ပါသည်
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase font-semibold">
              ပစ္စည်းအမည် (Item Name) *
            </label>
            <input
              type="text"
              required
              placeholder="ဥပမာ - ဘားမားပါတိတ် ရင်ဖုံး အင်္ကျီ / ပုဆိုး / ရေသန့်..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
              autoFocus
            />
          </div>

          {/* Price & Stock Quantity (အရေအတွက်) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-amber-300 uppercase font-semibold">
                  ရောင်းဈေး (Price) *
                </label>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {price ? formatPrice(parseFloat(price) || 0, currency) : ''}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="ဥပမာ - 35000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase font-semibold">
                လက်ကျန်အရေအတွက် (Stock Quantity) *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="ဥပမာ - 20"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-mono font-bold"
              />
            </div>
          </div>

          {/* Category & Quality / Purity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase font-semibold">
                အမျိုးအစား (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
              >
                <option value="ပါတိတ် / အထည် (Batik & Apparel)">ပါတိတ် / အထည် (Batik & Apparel)</option>
                <option value="လူသုံးကုန် (General Goods)">လူသုံးကုန် (General Goods)</option>
                <option value="စားသောက်ကုန် (Food & Beverage)">စားသောက်ကုန် (Food & Beverage)</option>
                <option value="အအေး / သောက်ရေ (Beverages)">အအေး / သောက်ရေ (Beverages)</option>
                <option value="အလှကုန် (Cosmetics)">အလှကုန် (Cosmetics)</option>
                <option value="အီလက်ထရောနစ် (Electronics)">အီလက်ထရောနစ် (Electronics)</option>
                <option value="အထွေထွေ (General)">အထွေထွေ (General)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase font-semibold">
                သတ်မှတ်ချက် / အဆင့် (Grade / Purity)
              </label>
              <input
                type="text"
                placeholder="ဥပမာ - စစ်စစ်၊ Premium၊ 100% Cotton"
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase font-semibold">
                SKU / ကုဒ်
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-amber-300 uppercase font-semibold">
                  ဘားကုဒ် (Barcode) *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] text-amber-400 hover:underline font-mono"
                >
                  ⚡ Auto Barcode
                </button>
              </div>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase font-semibold">
              အသေးစိတ် ဖော်ပြချက် (Description)
            </label>
            <textarea
              rows={2}
              placeholder="ပစ္စည်းနှင့်ပတ်သက်သော မှတ်ချက် သို့မဟုတ် အချက်အလက်..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn-gold-ripple px-6 py-2.5 text-xs font-orbitron font-bold uppercase text-black bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-[0_0_15px_rgba(245,183,0,0.3)] border border-amber-200 cursor-pointer"
            >
              + ပစ္စည်း သိမ်းဆည်းရန် (Save Product)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
