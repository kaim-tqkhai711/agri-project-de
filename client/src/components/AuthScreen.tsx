import React, { useState } from 'react';
import { Leaf, User, ShieldCheck, Lock, LogIn, Mail, Tractor, Loader2 } from 'lucide-react';

// Định nghĩa kiểu dữ liệu User trả về từ Backend
interface UserData {
  id: string;
  username: string;
  email: string;
  role: 'User' | 'Admin' | 'FarmOwner';
  accessToken: string;
}

interface AuthScreenProps {
  onLoginSuccess: (user: UserData) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'User' | 'Admin' | 'FarmOwner'>('User');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Xác định API Endpoint
      const endpoint = isLoginTab 
        ? 'http://localhost:8080/api/auth/signin' 
        : 'http://localhost:8080/api/auth/signup';

      // 2. Chuẩn bị dữ liệu gửi đi
      const payload: any = { username, password };
      
      if (!isLoginTab) {
        // Nếu là Đăng ký thì gửi thêm Email và Role
        payload.email = email;
        payload.role = role;
      }

      // 3. Gọi API (Fetch)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra từ Server');
      }

      // 4. Xử lý thành công
      if (isLoginTab) {
        // --- ĐĂNG NHẬP THÀNH CÔNG ---
        console.log("🔑 Token:", data.accessToken);
        
        // Lưu vào LocalStorage để dùng lâu dài
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data));
        
        // Chuyển hướng vào App chính
        onLoginSuccess(data);
      } else {
        // --- ĐĂNG KÝ THÀNH CÔNG ---
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLoginTab(true); // Chuyển về tab đăng nhập
        setError('');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối Server. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="bg-green-700 p-8 text-center relative overflow-hidden">
          {/* Họa tiết trang trí */}
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5" 
               style={{backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)', backgroundSize: '20px 20px'}}>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3 rounded-full shadow-lg mb-4 animate-bounce-slow">
              <Leaf className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">AgriTrace</h1>
            <p className="text-green-100 text-sm">Hệ thống Big Data Truy xuất nguồn gốc</p>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setIsLoginTab(true); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              isLoginTab ? 'text-green-700 border-b-4 border-green-700 bg-green-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              !isLoginTab ? 'text-green-700 border-b-4 border-green-700 bg-green-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {/* --- FORM --- */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* CHỌN ROLE (Chỉ hiện khi Đăng ký) */}
            {!isLoginTab && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: 'User', label: 'Khách', icon: User },
                  { id: 'FarmOwner', label: 'Chủ Trại', icon: Tractor },
                  { id: 'Admin', label: 'Admin', icon: ShieldCheck }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                      role === r.id 
                        ? 'border-green-600 bg-green-50 text-green-700' 
                        : 'border-gray-100 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <r.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{r.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* USERNAME */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Ví dụ: nongdan01"
                  required
                />
              </div>
            </div>

            {/* EMAIL (Chỉ hiện khi Đăng ký) */}
            {!isLoginTab && (
              <div className="animate-fade-in-down">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* THÔNG BÁO LỖI */}
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                ⚠️ {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? 'Đang xử lý...' : (isLoginTab ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ NGAY')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;