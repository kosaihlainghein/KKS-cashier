import React, { useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from 'html5-qrcode';
import { Product } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';

interface LiveCameraScannerModalProps {
  onClose: () => void;
  availableProducts: Product[];
  onProductScanned: (product: Product) => void;
  onRegisterNewBarcode: (barcode: string) => void;
  t: TranslationDictionary;
}

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  onClose,
  availableProducts,
  onProductScanned,
  onRegisterNewBarcode,
  t,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'kks-html5-camera-scanner';

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    // Helper to safely stop and clean up an Html5Qrcode scanner instance
    const stopAndClearScanner = async (scanner: Html5Qrcode) => {
      try {
        let isRunning = false;
        try {
          isRunning =
            scanner.isScanning ||
            scanner.getState() === Html5QrcodeScannerState.SCANNING ||
            scanner.getState() === Html5QrcodeScannerState.PAUSED;
        } catch {
          isRunning = false;
        }

        if (isRunning) {
          await scanner.stop();
        }
      } catch (err) {
        // Suppress benign 'Cannot stop, scanner is not running or paused' warnings
        console.warn('Scanner stop warning safely caught:', err);
      }

      try {
        scanner.clear();
      } catch {
        // ignore clear errors on unmounted dom
      }
    };

    const startScanner = async () => {
      try {
        const targetElement = document.getElementById(containerId);
        if (!targetElement || !isMounted) return;

        html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            if (isMounted) {
              handleBarcodeDetected(decodedText.trim());
            }
          },
          () => {
            // scan frames in progress
          }
        );

        if (!isMounted) {
          // If unmounted while camera stream was starting, clean up immediately
          await stopAndClearScanner(html5QrCode);
        } else {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.warn('Camera error or permission denied:', err);
        setScannerError(
          err instanceof Error
            ? err.message
            : 'Camera access unavailable or permission required. You can also type or paste any barcode below.'
        );
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        stopAndClearScanner(scanner);
      }
    };
  }, []);

  const handleBarcodeDetected = (code: string) => {
    if (!code) return;
    setLastScannedCode(code);
    soundFX.playScanBeep();

    // Check if code matches any product in shared cloud catalog
    const found = availableProducts.find(
      (p) =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.sku.toLowerCase() === code.toLowerCase() ||
        p.id.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      setMatchedProduct(found);
      onProductScanned(found);
    } else {
      setMatchedProduct(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleBarcodeDetected(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border-2 border-amber-500/40 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(245,183,0,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/25 bg-gradient-to-r from-amber-950/40 to-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm sm:text-base text-amber-200">
                Live Camera Barcode Scanner
              </h3>
              <p className="text-[11px] text-amber-400/70 font-mono">
                Multi-Device Universal Optical Reader
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video / Camera Viewport */}
        <div className="p-4 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black border border-amber-500/30 min-h-[240px] flex items-center justify-center">
            {/* HTML5 QR Code Container */}
            <div id={containerId} className="w-full" />

            {/* Laser overlay animation when scanning */}
            {isScanning && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-pulse pointer-events-none" />
            )}

            {/* Camera error message fallback */}
            {scannerError && (
              <div className="p-4 text-center text-xs font-mono text-amber-300/80 max-w-sm">
                <svg className="w-8 h-8 mx-auto text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {scannerError}
              </div>
            )}
          </div>

          {/* Scanned Result Banner */}
          {lastScannedCode && (
            <div className="p-3.5 rounded-xl border transition-all animate-fadeIn bg-[#12141f] border-amber-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-500/70 uppercase">
                  DETECTED CIPHER / BARCODE:
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {lastScannedCode}
                </span>
              </div>

              {matchedProduct ? (
                <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-orbitron font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                      <span>✓ Added to Order:</span>
                      <span className="text-amber-100">{matchedProduct.name}</span>
                    </div>
                    <div className="text-xs font-mono text-amber-400/80">
                      ${matchedProduct.price.toLocaleString()} · Stock: {matchedProduct.stock} units
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    IN STOCK
                  </span>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="text-xs text-amber-200/90 font-mono">
                    Unregistered barcode in shared inventory.
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onRegisterNewBarcode(lastScannedCode);
                    }}
                    className="btn-gold-ripple px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs whitespace-nowrap cursor-pointer shadow-sm hover:brightness-110"
                  >
                    + Add to Stock ({lastScannedCode})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Barcode Input Fallback for Handheld USB Scanners / Keyboard */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or scan with USB laser / enter barcode..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 bg-black/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              Scan
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-mono text-amber-500/60">
          <span>Continuous multi-device scan enabled</span>
          <button onClick={onClose} className="text-amber-400 hover:text-amber-200 cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
