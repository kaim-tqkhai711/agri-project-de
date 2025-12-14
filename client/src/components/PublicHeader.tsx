import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, LayoutDashboard, Leaf } from 'lucide-react';

const PublicHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  // Kiểm tra đăng nhập khi load trang
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    // Xóa Token và User khỏi bộ nhớ
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Điều hướng về trang đăng nhập
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
           <div className="bg-green-100 p-2 rounded-full group-hover:bg-green-200 transition-colors">
             <Leaf className="w-5 h-5 text-green-700" />
           </div>
           <span className="font-bold text-xl text-gray-800">AgriTrace</span>
        </Link>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-4">
          {user ? (
            // --- TRẠNG THÁI ĐÃ ĐĂNG NHẬP ---
            <>
              <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <User size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                  user.role === 'Admin' ? 'bg-red-100 text-red-600' : 
                  user.role === 'FarmOwner' ? 'bg-blue-100 text-blue-600' : 
                  'bg-green-100 text-green-600'
                }`}>
                  {user.role}
                </span>
              </div>

              {/* Nếu là Admin/Chủ trại đi lạc vào trang chủ -> Hiện nút về Dashboard */}
              {(user.role === 'Admin' || user.role === 'FarmOwner') && (
                <Link 
                  to="/admin" 
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                  title="Vào trang quản trị"
                >
                  <LayoutDashboard size={20} />
                </Link>
              )}
              
              {/* NÚT ĐĂNG XUẤT */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-sm font-medium"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </>
          ) : (
            // --- TRẠNG THÁI CHƯA ĐĂNG NHẬP ---
            <Link 
              to="/login" 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:shadow-green-500/30 transition-all text-sm"
            >
              <LogIn size={16} />
              Đăng Nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;