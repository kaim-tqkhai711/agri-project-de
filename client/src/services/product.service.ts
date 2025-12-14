import api from "./api"; 
import type { IProduct } from "../types/index"; 
import authHeader from "./auth-header"; // <--- Import hàm lấy Token

export const ProductService = {
  // --- 1. PUBLIC API (Ai cũng xem được -> Không cần authHeader) ---
  
  // Cập nhật getAll để hỗ trợ phân trang (cho Dashboard)
  getAll: (page = 1, limit = 10) => 
    api.get(`/products?page=${page}&limit=${limit}`),

  // Thêm hàm lấy thống kê Big Data
  getAnalytics: () => 
    api.get("/products/analytics/general"),

  getById: (id: string) => 
    api.get<IProduct>(`/products/${id}`),

  findByQr: (qrCode: string) => 
    api.get<IProduct[]>(`/products?qrCode=${qrCode}`),

  // --- 2. SECURED API (Cần Token -> Phải thêm { headers: authHeader() }) ---
  
  create: (data: Partial<IProduct>) => 
    api.post<IProduct>("/products", data, { headers: authHeader() }),

  update: (id: string, data: Partial<IProduct>) => 
    api.put(`/products/${id}`, data, { headers: authHeader() }),

  // ĐÂY LÀ CHỖ SỬA LỖI KHÔNG XÓA ĐƯỢC:
  delete: (id: string) => 
    api.delete(`/products/${id}`, { headers: authHeader() }),
};

// Admin Service cũng cần bảo mật
export const AdminService = {
  backupDB: () => 
    api.post<{success: boolean, log: string}>("/admin/backup", {}, { headers: authHeader() }),
    
  restoreDB: () => 
    api.post<{success: boolean, log: string}>("/admin/restore", {}, { headers: authHeader() })
};