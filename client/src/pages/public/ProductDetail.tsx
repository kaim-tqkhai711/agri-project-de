import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductService } from "../../services/product.service";
import type { IProduct, IFarm } from "../../types";
import { 
  ArrowLeft, MapPin, Calendar, Tag, ShieldCheck, 
  Leaf, Share2, Copy, CheckCircle2, AlertTriangle, Loader2 
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State quản lý
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- 1. LOGIC FETCH DATA AN TOÀN ---
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    // Xác định phương thức gọi API: ID chuẩn MongoDB (24 ký tự hex) -> getById, ngược lại -> findByQr
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const apiCall = isObjectId ? ProductService.getById(id) : ProductService.findByQr(id);

    apiCall
      .then((res: any) => {
        // Chuẩn hóa dữ liệu: API có thể trả về { data: ... } hoặc trực tiếp ...
        // Nếu là mảng (khi tìm theo QR), lấy phần tử đầu tiên
        let data = res.data || res;
        
        // Xử lý trường hợp data nằm trong thuộc tính 'data' của response phân trang (nếu có)
        if (data && data.data && Array.isArray(data.data)) {
             data = data.data[0];
        } else if (Array.isArray(data)) {
             data = data[0];
        }

        if (data) {
          setProduct(data);
        } else {
          setProduct(null);
          setError("Không tìm thấy dữ liệu sản phẩm.");
        }
      })
      .catch((err) => {
        console.error("Lỗi API:", err);
        setProduct(null);
        setError("Đã xảy ra lỗi khi kết nối đến hệ thống.");
      })
      .finally(() => {
        // Thêm delay nhỏ để tránh flash loading quá nhanh gây khó chịu (tùy chọn)
        setTimeout(() => setLoading(false), 300);
      });
  }, [id]);

  // --- 2. XỬ LÝ SỰ KIỆN ---
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyId = () => {
      if (product) {
          navigator.clipboard.writeText(product.qrCode || product._id);
          alert("Đã sao chép mã sản phẩm!");
      }
  };

  // --- 3. GIAO DIỆN LOADING (SKELETON UI) ---
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 space-y-6">
        <Loader2 className="animate-spin text-emerald-600 mb-2" size={48}/>
        <div className="w-full max-w-md space-y-4 animate-pulse">
            <div className="h-64 bg-gray-200 rounded-[2rem] w-full shadow-sm"></div>
            <div className="flex justify-between">
                <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
            </div>
            <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-200 rounded-2xl"></div>
                <div className="h-20 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Đang truy xuất dữ liệu từ Big Data...</p>
    </div>
  );

  // --- 4. GIAO DIỆN LỖI / KHÔNG TÌM THẤY ---
  if (!product || error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6 font-sans">
        <div className="bg-red-50 p-6 rounded-full mb-6 animate-bounce-slow">
            <AlertTriangle className="text-red-500" size={64}/>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy dữ liệu</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
            {error || `Mã truy xuất "${id}" không tồn tại trong hệ thống hoặc đã bị xóa.`}
        </p>
        <button 
            onClick={() => navigate('/')} 
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-transform active:scale-95 flex items-center gap-2"
        >
            <ArrowLeft size={18} /> Quét mã khác
        </button>
    </div>
  );

  // --- 5. CHUẨN HÓA DỮ LIỆU HIỂN THỊ (SAFE ACCESS) ---
  // Sử dụng Optional Chaining (?.) và Nullish Coalescing (??) để tránh crash
  const farmInfo = (product.farmId && typeof product.farmId === 'object') 
    ? (product.farmId as unknown as IFarm) 
    : { name: "Nông trại liên kết", address: "Đang cập nhật địa chỉ...", contactInfo: { phone: "" } };

  const priceDisplay = (product.price ?? 0).toLocaleString();
  
  // Helper format ngày tháng an toàn
  const formatDate = (dateString?: string) => {
      if (!dateString) return "---";
      try {
          return new Date(dateString).toLocaleDateString('vi-VN');
      } catch (e) {
          return "Lỗi định dạng";
      }
  };

  const mfgDate = formatDate(product.dates?.mfg);
  const expDate = formatDate(product.dates?.exp);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans selection:bg-emerald-100">
      
      {/* Floating Header */}
      <div className="fixed top-0 w-full z-50 px-4 py-4 flex items-center justify-between pointer-events-none">
        <button onClick={() => navigate('/')} className="pointer-events-auto p-3 bg-white/90 backdrop-blur-xl rounded-full shadow-sm border border-gray-100 hover:bg-white transition-all text-gray-700 hover:text-emerald-600 active:scale-95">
            <ArrowLeft size={22}/>
        </button>
        <button onClick={handleShare} className="pointer-events-auto p-3 bg-white/90 backdrop-blur-xl rounded-full shadow-sm border border-gray-100 hover:bg-white transition-all text-gray-700 hover:text-emerald-600 active:scale-95 relative group">
            {copied ? <CheckCircle2 size={22} className="text-emerald-500"/> : <Share2 size={22}/>}
            {/* Tooltip */}
            <span className="absolute top-14 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {copied ? "Đã sao chép!" : "Chia sẻ liên kết"}
            </span>
        </button>
      </div>

      <div className="max-w-md mx-auto relative">
        
        {/* Hero Image Section */}
        <div className="h-[22rem] w-full relative overflow-hidden bg-emerald-900 rounded-b-[2.5rem] shadow-xl">
            <img 
                src={product.imageUrl || "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80"} 
                className="w-full h-full object-cover opacity-90 scale-105" 
                alt={product.name || "Sản phẩm AgriTrace"} 
            />
            {/* Gradient Overlay chuyên nghiệp */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 pb-10 text-white">
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-emerald-500/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-900/20">
                        <ShieldCheck size={14}/> VietGAP Verified
                    </span>
                </div>
                <h1 className="text-4xl font-bold leading-tight mb-2 shadow-sm tracking-tight">{product.name || "Tên sản phẩm"}</h1>
                <p className="text-emerald-100 text-sm flex items-center gap-2 font-medium opacity-90">
                    <div className="bg-white/20 p-1 rounded-full"><Leaf size={12}/></div> 
                    {farmInfo.name}
                </p>
            </div>
        </div>

        {/* Main Content Container */}
        <div className="px-5 -mt-8 relative z-10 space-y-5">
            
            {/* Price & Status Card */}
            <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-6 flex justify-between items-center border border-gray-100">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giá niêm yết</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{priceDisplay}</p>
                        <span className="text-sm font-semibold text-gray-400">VNĐ</span>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border shadow-sm ${
                    product.status === 'Available' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : product.status === 'Sold' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                    {product.status === 'Available' ? '● Đang bán' : product.status}
                </div>
            </div>

            {/* Time Info Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:border-emerald-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                        <Calendar size={20}/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">Ngày thu hoạch</p>
                        <p className="font-bold text-gray-800 text-base">{mfgDate}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:border-emerald-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
                        <Tag size={20}/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">Hạn sử dụng</p>
                        <p className="font-bold text-gray-800 text-base">{expDate}</p>
                    </div>
                </div>
            </div>

            {/* Origin Info (Timeline Style) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-50"></div>

                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2.5">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700"><MapPin size={18}/></div>
                    Hành trình nguồn gốc
                </h3>
                
                <div className="relative pl-6 space-y-6">
                    {/* Line nối */}
                    <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gray-100"></div>

                    {/* Node 1: Nông trại */}
                    <div className="relative">
                        <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white shadow-sm z-10"></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Nơi sản xuất</p>
                            <p className="font-bold text-gray-800 text-lg leading-tight">{farmInfo.name}</p>
                        </div>
                    </div>

                    {/* Node 2: Địa chỉ */}
                    <div className="relative">
                        <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-gray-400 rounded-full ring-4 ring-white shadow-sm z-10"></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Địa chỉ canh tác</p>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
                                {farmInfo.address}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    Mô tả sản phẩm
                </h3>
                <p className="text-gray-600 text-sm leading-7 text-justify">
                    {product.description || "Sản phẩm được canh tác theo quy trình VietGAP nghiêm ngặt, đảm bảo không tồn dư thuốc bảo vệ thực vật, an toàn tuyệt đối cho sức khỏe người tiêu dùng. Được theo dõi và ghi nhận dữ liệu minh bạch trên hệ thống AgriTrace."}
                </p>
            </div>

            {/* Footer / Copy ID */}
            <div className="text-center py-8">
                <div 
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform cursor-pointer hover:border-emerald-300 group"
                >
                    <Copy size={14} className="text-gray-400 group-hover:text-emerald-500 transition-colors"/>
                    <span className="text-xs font-mono text-gray-500 font-medium tracking-wide group-hover:text-gray-700">
                        ID: {product.qrCode || product._id}
                    </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 font-medium tracking-wide uppercase">
                    Powered by AgriTrace Big Data System
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;