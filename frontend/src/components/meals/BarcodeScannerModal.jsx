import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, ScanBarcode, Keyboard } from 'lucide-react';
import { barcodeService } from '../../services';
import toast from 'react-hot-toast';

const BarcodeScannerModal = ({ isOpen, onClose, onProductFound }) => {
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const scannerRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setManualBarcode('');
      setMode('camera');
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const readerId = 'barcode-reader';
      
      // Wait a tick for the DOM element to exist
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const readerElement = document.getElementById(readerId);
      if (!readerElement) return;

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
        },
        async (decodedText) => {
          // Barcode detected
          await stopScanner();
          handleBarcodeLookup(decodedText);
        },
        () => {
          // Scan error (ignore - happens every frame without detection)
        }
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      toast.error('Could not access camera. Try entering the barcode manually.');
      setMode('manual');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleBarcodeLookup = async (barcode) => {
    setLoading(true);
    try {
      const { data } = await barcodeService.search(barcode);
      
      if (!data.success) {
        toast.error(data.message || 'Product not found');
        setLoading(false);
        return;
      }

      const sourceLabel = data.product.source === 'ai-estimated' ? ' (AI estimated)' : '';
      toast.success(`Found: ${data.product.productName}${sourceLabel}`);
      onProductFound(data.product);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to look up barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) {
      toast.error('Please enter a barcode number');
      return;
    }
    handleBarcodeLookup(manualBarcode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative card max-w-md w-full border-[#333] animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-brand-orange-500" />
            Scan Barcode
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-surface transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-dark-border">
          <button
            onClick={() => { setMode('camera'); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'camera' 
                ? 'text-brand-orange-500 border-b-2 border-brand-orange-500 bg-brand-orange-500/5' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera Scan
          </button>
          <button
            onClick={() => { stopScanner(); setMode('manual'); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'manual' 
                ? 'text-brand-orange-500 border-b-2 border-brand-orange-500 bg-brand-orange-500/5' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Enter Manually
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-10 h-10 text-brand-orange-500 animate-spin" />
              <p className="text-gray-400 text-sm">Looking up product...</p>
            </div>
          ) : mode === 'camera' ? (
            <div className="space-y-4">
              {/* Scanner viewport */}
              <div 
                id="barcode-reader" 
                ref={readerRef}
                className="w-full rounded-xl overflow-hidden bg-dark-bg border border-dark-border"
              />
              
              {!scanning && (
                <button
                  onClick={startScanner}
                  className="w-full bg-brand-orange-500 text-white py-3 rounded-xl font-medium hover:bg-brand-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                Point your camera at the barcode on a food package
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="label text-sm">Barcode Number</label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g. 5449000000996"
                  className="input-field bg-dark-bg"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the barcode number printed below the barcode lines on the product
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-brand-orange-500 text-white py-3 rounded-xl font-medium hover:bg-brand-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <ScanBarcode className="w-5 h-5" />
                Look Up Product
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
