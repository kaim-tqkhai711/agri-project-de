import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProductService } from "../../services/product.service";
import type { IProduct } from "../../types"; 
import { 
  Edit, Trash2, Loader2, Package, Calendar, 
  PackagePlus, Sprout, TrendingUp, DollarSign, Activity 
} from "lucide-react";

// Interface cho dữ liệu Thống kê
interface Stats {
  totalProducts: number;
  avgPrice: number;
  totalAvailable: number;
  totalSold: number;
}

const Dashboard = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Lấy dữ liệu (Products + Analytics) ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // A. Lấy danh sách sản phẩm (Mới nhất, giới hạn 10 dòng)
      // Lưu ý: Dùng fetch trực tiếp ở đây để truyền query params ?limit=10 & sort
      // Hoặc nếu ProductService.getAll hỗ trợ params thì dùng service.
      const productsRes = await fetch('http://localhost:8080/api/products?limit=10&page=1');
      const productsJson = await productsRes.json();
      
      // Xử lý dữ liệu trả về: Backend trả về { data: [], pagination: {} }
      if (productsJson.data) {
        setProducts(productsJson.data);
      } else if (Array.isArray(productsJson)) {
        // Fallback cho trường hợp API cũ
        setProducts(productsJson.slice(0, 10));
      }

      // B. Lấy số liệu Thống kê Big Data
      const statsRes = await fetch('http://localhost:8080/api/products/analytics/general');
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
      }

    } catch (err) {
      console.error("Lỗi tải dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Xử lý xóa ---
  const handleDelete = async (id: string) => {
    if(!window.confirm("CẢNH BÁO: Hành động này sẽ được ghi vào Audit Log. Tiếp tục xóa?")) return;
    try {
        await ProductService.delete(id);
        // Cập nhật giao diện
        setProducts(products.filter(p => p._id !== id));
        // Cập nhật nhanh số liệu thống kê (Client-side)
        if (stats) setStats({ ...stats, totalProducts: stats.totalProducts - 1 });
    } catch (error) {
        alert("Xóa thất bại! Vui lòng kiểm tra lại quyền Admin.");
    }
  };

  // Helper formatting
  const getFarmName = (farmId: string | any) => {
    if (typeof farmId === 'object' && farmId?.name) return farmId.name;
    return "Chưa cập nhật";
  };

  const formatDate = (dateStr: string) => {
      if(!dateStr) return "---";
      return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  // --- 3. Loading UI ---
  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-emerald-600">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Đang phân tích dữ liệu Big Data...</p>
    </div>
  );

  // --- 4. Main UI ---
  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Package className="text-emerald-600" size={28} />
                Tổng quan Kho Nông sản
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Cập nhật dữ liệu thời gian thực từ hệ thống.</p>
        </div>
        <Link to="/admin/create" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
            <PackagePlus size={18} /> Thêm sản phẩm
        </Link>
      </div>

      {/* --- SECTION: ANALYTICS CARDS (MỚI) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Package size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Tổng sản phẩm</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats?.totalProducts || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600"><DollarSign size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Giá trung bình</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {stats?.avgPrice ? Math.round(stats.avgPrice).toLocaleString() : 0} đ
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600"><Activity size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Đang bán</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats?.totalAvailable || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-lg text-orange-600"><TrendingUp size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Đã tiêu thụ</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats?.totalSold || 0}</h3>
          </div>
        </div>
      </div>

      {/* --- SECTION: TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Sản phẩm mới nhập kho</h3>
            <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border">Hiển thị 10 mới nhất</span>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                <th className="px-6 py-4">Mã QR</th>
                <th className="px-6 py-4">Tên Sản phẩm</th>
                <th className="px-6 py-4">Nông trại</th>
                <th className="px-6 py-4">Giá & Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-100">
                            {p.qrCode}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div>
                            <p className="font-bold text-gray-800 text-[15px] mb-0.5">{p.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar size={12}/> {formatDate(p.dates?.mfg)}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Sprout size={14} className="text-gray-400"/> {getFarmName(p.farmId)}
                        </p>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                            <span className="font-bold text-gray-800">{p.price.toLocaleString()} đ</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                p.status === 'Available' ? 'bg-green-50 text-green-600 border-green-200' :
                                p.status === 'Sold' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                'bg-red-50 text-red-600 border-red-200'
                            }`}>
                                {p.status === 'Available' ? 'Đang bán' : p.status}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-3">
                            <Link to={`/admin/edit/${p._id}`} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-all">
                                <Edit size={18} />
                            </Link>
                            <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                
                {products.length === 0 && !loading && (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            <Package size={40} className="mx-auto mb-3 opacity-50"/>
                            <p>Chưa có dữ liệu nào.</p>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;