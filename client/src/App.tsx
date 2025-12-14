import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Components
import AuthScreen from "./components/AuthScreen"; // <--- Import AuthScreen
import ProtectedRoute from "./components/ProtectedRoute"; // <--- Import ProtectedRoute

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import DataTools from "./pages/admin/DataTools";
import ProductForm from "./pages/admin/ProductForm";

// Public Pages
import Home from "./pages/public/Home";
import ProductDetail from "./pages/public/ProductDetail";

// Component Wrapper để xử lý logic sau khi Login thành công
const LoginWrapper = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: any) => {
    // Điều hướng dựa trên vai trò
    if (user.role === 'Admin' || user.role === 'FarmOwner') {
      navigate('/admin'); // Admin vào Dashboard
    } else {
      navigate('/'); // User thường về trang chủ
    }
  };

  return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- AUTH ROUTE --- */}
        <Route path="/login" element={<LoginWrapper />} />

        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* --- PROTECTED ADMIN ROUTES (Đã được bảo vệ) --- */}
        <Route element={<ProtectedRoute />}>
           <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<Dashboard />} />
             <Route path="tools" element={<DataTools />} />
             <Route path="create" element={<ProductForm />} />
             <Route path="edit/:id" element={<ProductForm />} />
           </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;