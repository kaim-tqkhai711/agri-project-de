import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // 1. Lấy thông tin user từ LocalStorage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // 2. Kiểm tra đăng nhập
  if (!user || !user.accessToken) {
    // Nếu chưa đăng nhập -> Chuyển hướng về trang Login
    return <Navigate to="/login" replace />;
  }

  // 3. (Tuỳ chọn) Kiểm tra quyền Admin
  // Nếu bạn muốn chặn User thường vào trang Admin:
  if (user.role === 'User') {
     alert("Bạn không có quyền truy cập trang quản trị!");
     return <Navigate to="/" replace />;
  }

  // 4. Nếu hợp lệ -> Render các route con (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;