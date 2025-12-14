import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductService } from "../../services/product.service";
import type { IProduct } from "../../types";
import { Save, ArrowLeft, QrCode, Tag, DollarSign, MapPin, Loader2, Activity, Calendar } from "lucide-react";

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // State hiển thị loading
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState<Partial<IProduct>>({
    qrCode: "", name: "", price: 0,
    dates: { mfg: "", exp: "" },
    farmId: "", status: "Available", description: ""
  });

  // --- 1. Load dữ liệu khi Edit ---
  useEffect(() => {
    if (isEditMode && id) {
      setFetching(true);
      ProductService.getById(id).then((res: any) => {
        const data = res.data;
        
        // Format ngày tháng: YYYY-MM-DD để hiển thị đúng trên input[type=date]
        if (data.dates) {
          const fmt = (d: string) => d ? new Date(d).toISOString().split('T')[0] : "";
          data.dates = { mfg: fmt(data.dates.mfg), exp: fmt(data.dates.exp) };
        }

        // Xử lý FarmID: Nếu populate object -> lấy _id, nếu string -> giữ nguyên
        if (typeof data.farmId === 'object' && data.farmId !== null) {
            data.farmId = (data.farmId as any)._id;
        }

        setFormData(data);
      }).catch(err => {
        alert("Không tìm thấy sản phẩm!");
        navigate("/admin");
      }).finally(() => setFetching(false));
    }
  }, [id, isEditMode, navigate]);

  // --- 2. Xử lý Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditMode && id) {
        await ProductService.update(id, formData);
        // alert("Cập nhật thành công!"); // Có thể bỏ alert nếu muốn mượt hơn
      } else {
        await ProductService.create(formData);
      }
      navigate("/admin"); // Quay về Dashboard ngay
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra. Kiểm tra lại mã QR!";
      alert(`Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Giao diện Loading khi đang lấy dữ liệu sửa ---
  if (fetching) return (
    <div className="h-[50vh] flex items-center justify-center text-emerald-600">
        <Loader2 size={40} className="animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin")} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
          <ArrowLeft className="text-gray-600" size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditMode ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Loading Overlay khi đang Submit */}
        {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
                <Loader2 size={40} className="animate-spin text-emerald-600"/>
            </div>
        )}

        {/* --- CỘT TRÁI: THÔNG TIN CƠ BẢN --- */}
        <div className="space-y-5">
          <h3 className="font-bold text-gray-400 text-xs uppercase border-b pb-2">Thông tin định danh</h3>
          
          <InputGroup 
            icon={QrCode} label="Mã QR (Duy nhất)" 
            value={formData.qrCode} 
            onChange={(val: any) => setFormData({...formData, qrCode: val})}
            disabled={isEditMode} // Không cho sửa mã QR
            placeholder="VD: PROD-001" required
          />

          <InputGroup 
            icon={Tag} label="Tên sản phẩm" 
            value={formData.name} 
            onChange={(val: any) => setFormData({...formData, name: val})}
            placeholder="VD: Bưởi Da Xanh" required
          />

          <InputGroup 
            icon={DollarSign} label="Giá bán (VNĐ)" type="number"
            value={formData.price} 
            onChange={(val: any) => setFormData({...formData, price: Number(val)})}
            required
          />

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
            <div className="relative">
                <Activity className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="pl-9 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                    <option value="Available">🟢 Đang bán</option>
                    <option value="Sold">🔴 Đã bán</option>
                    <option value="Expired">⚠️ Hết hạn</option>
                    <option value="Harvested">🌾 Vừa thu hoạch</option>
                </select>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: CHI TIẾT TRUY XUẤT --- */}
        <div className="space-y-5">
          <h3 className="font-bold text-gray-400 text-xs uppercase border-b pb-2">Nguồn gốc & Thời gian</h3>
          
          <InputGroup 
            icon={MapPin} label="Farm ID (Mã định danh trại)" 
            value={formData.farmId} 
            onChange={(val: any) => setFormData({...formData, farmId: val})}
            placeholder="Nhập ID (VD: 65fd...)" required
          />

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ngày SX</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                        type="date" required 
                        className="pl-9 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        value={formData.dates?.mfg}
                        onChange={e => setFormData({...formData, dates: {...formData.dates!, mfg: e.target.value}})}
                    />
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hạn SD</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                        type="date" required 
                        className="pl-9 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        value={formData.dates?.exp}
                        onChange={e => setFormData({...formData, dates: {...formData.dates!, exp: e.target.value}})}
                    />
                </div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea 
                rows={4} 
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Thông tin thêm về quy trình, giống cây..."
            ></textarea>
          </div>
        </div>

        {/* --- BUTTONS --- */}
        <div className="md:col-span-2 pt-6 border-t flex justify-end gap-3">
            <button 
                type="button" 
                onClick={() => navigate("/admin")} 
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
                Hủy bỏ
            </button>
            <button 
                type="submit" 
                disabled={loading}
                className={`px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} 
                {isEditMode ? "Cập nhật" : "Lưu dữ liệu"}
            </button>
        </div>
      </form>
    </div>
  );
};

// --- COMPONENT CON (Giúp code gọn hơn) ---
const InputGroup = ({ icon: Icon, label, value, onChange, type="text", ...props }: any) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input 
                type={type} 
                className="pl-9 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all" 
                value={value || ""} 
                onChange={e => onChange(e.target.value)} 
                {...props} 
            />
        </div>
    </div>
);

export default ProductForm;