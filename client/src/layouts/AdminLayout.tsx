import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Database, LogOut, PackagePlus, Sprout } from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();

  // Hàm hỗ trợ style cho link đang active
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? "bg-emerald-600 text-white shadow-md"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  const handleLogout = () => {
    // Xóa token nếu có
    // localStorage.removeItem('token'); 
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* --- SIDEBAR (Thanh bên tối màu giống Figma) --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 shadow-xl relative z-10">
        {/* Header Sidebar */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
             <Sprout size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">AgriTrace</h1>
            <p className="text-[11px] text-emerald-400 font-medium tracking-wider uppercase">Big Data System</p>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          <NavLink to="/admin" end className={navLinkClass}>
            <LayoutDashboard size={20} /> 
            <span className="font-medium">Tổng quan dữ liệu</span>
          </NavLink>
          
          <NavLink to="/admin/create" className={navLinkClass}>
            <PackagePlus size={20} />
            <span className="font-medium">Thêm sản phẩm</span>
          </NavLink>

          {/* Divider */}
          <div className="my-6 px-4">
             <div className="h-px bg-slate-800"></div>
             <span className="text-[10px] uppercase font-bold text-slate-500 mt-2 block tracking-widest">Kỹ thuật</span>
          </div>

          <NavLink to="/admin/tools" className={navLinkClass}>
            <Database size={20} />
            <span className="font-medium">Data Engineering</span>
          </NavLink>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 w-full px-4 py-3 rounded-lg transition-colors duration-200 group">
            <LogOut size={20} className="group-hover:text-red-400 transition-colors"/> 
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (Phần nội dung chính thay đổi) --- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-6 md:p-8 relative">
        {/* Background trang trí mờ */}
        <div className="absolute inset-0 pointer-events-none bg-[url('https://file.rendit.io/n/DesignSystem/Assets/Images/BackgroundPatterns/DotGrid.png')] opacity-[0.03] bg-repeat"></div>
        <div className="max-w-7xl mx-auto relative z-10">
           <Outlet /> {/* Đây là nơi các trang con (Dashboard, Tools...) sẽ hiển thị */}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;