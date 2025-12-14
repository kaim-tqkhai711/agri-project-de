import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import PublicHeader from '../../components/PublicHeader';
import { ScanLine, Search, X, Clock, ChevronRight, QrCode, Camera } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Home = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  
  // Dùng ref để kiểm soát instance của scanner tránh lỗi render 2 lần
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // --- 1. LOAD HISTORY ---
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('scan_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const addToHistory = (id: string) => {
    // Lưu tối đa 5 mã gần nhất, không trùng lặp
    const newHistory = [id, ...history.filter(item => item !== id)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('scan_history', JSON.stringify(newHistory));
  };

  // --- 2. NAVIGATION HANDLER ---
  const handleGoToProduct = (productCode: string) => {
    if (!productCode) return;
    // Logic: Nếu quét ra URL đầy đủ, cắt lấy ID cuối cùng
    const cleanCode = productCode.split('/').pop() || productCode;
    addToHistory(cleanCode);
    navigate(`/product/${cleanCode}`);
  };

  const onScanSuccess = (decodedText: string) => {
    // Tắt scanner trước khi chuyển trang để giải phóng camera
    if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
    }
    setShowScanner(false);
    handleGoToProduct(decodedText);
  };

  // --- 3. SCANNER EFFECT ---
  useEffect(() => {
    if (showScanner) {
      // Khởi tạo Scanner
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }, 
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        },
        false
      );
      scannerRef.current = scanner;
      
      scanner.render(onScanSuccess, (error) => {
          // Bỏ qua lỗi quét liên tục (console spam)
      });
    }

    // Cleanup function: Chạy khi component unmount hoặc tắt scanner
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.warn("Scanner cleanup warning:", err));
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <PublicHeader />

      <main className="flex-1 flex flex-col items-center pt-10 px-4 pb-10">
        <div className="w-full max-w-md space-y-8">
          
          {/* --- SECTION 1: SCANNER --- */}
          {showScanner ? (
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-200 relative animate-in zoom-in duration-300">
              <h3 className="text-center font-bold text-gray-700 mb-2 flex items-center justify-center gap-2">
                <Camera size={20} className="text-emerald-600"/> Đang kích hoạt Camera...
              </h3>
              <div id="reader" className="rounded-xl overflow-hidden bg-black min-h-[300px]"></div>
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors z-10 shadow-sm"
              >
                <X size={20}/>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative inline-block group cursor-pointer" onClick={() => setShowScanner(true)}>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-emerald-400 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                
                {/* Main Button */}
                <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-10 rounded-[2rem] shadow-2xl hover:scale-[1.02] transition-transform duration-300 flex flex-col items-center justify-center border-4 border-emerald-400/20">
                  <ScanLine size={64} className="text-white mb-3" />
                  <span className="text-white font-bold text-xl tracking-wide">QUÉT MÃ QR</span>
                </div>
              </div>
              <h2 className="mt-6 text-xl font-bold text-gray-800">Truy xuất nguồn gốc</h2>
              <p className="text-gray-500 mt-1 text-sm">Sử dụng Camera để quét mã trên sản phẩm</p>
            </div>
          )}

          {/* --- SECTION 2: MANUAL INPUT --- */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Hoặc nhập mã thủ công</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 flex items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <div className="pl-3 pr-2 text-gray-400"><QrCode size={20} /></div>
              <input 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToProduct(code)}
                placeholder="VD: PROD-123456"
                className="flex-1 py-3 outline-none text-gray-700 placeholder:text-gray-400 font-medium bg-transparent"
              />
              <button 
                onClick={() => handleGoToProduct(code)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg transition-colors shadow-md"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* --- SECTION 3: HISTORY --- */}
          {history.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Clock size={16} className="text-emerald-600" />
                  Lịch sử quét
                </h3>
                <button 
                  onClick={() => { setHistory([]); localStorage.removeItem('scan_history'); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
              
              <div className="space-y-3">
                {history.map((item, index) => (
                  <Link 
                    key={index} 
                    to={`/product/${item}`}
                    className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <QrCode size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">{item}</p>
                        <p className="text-[10px] text-gray-400">Đã xem gần đây</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500" />
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Home;