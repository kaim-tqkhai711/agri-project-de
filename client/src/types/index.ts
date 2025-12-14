// src/types/index.ts

// 1. Định nghĩa cấu trúc Nông trại (Khi populate)
export interface IFarm {
  _id: string;
  name: string;
  vietGapCode?: string;
  address?: string;
  contactInfo?: {
    phone: string;
    email: string;
  };
}

// 2. Định nghĩa cấu trúc Sản phẩm (Khớp 100% với MongoDB Compass)
export interface IProduct {
  _id: string; // MongoDB luôn trả về _id
  qrCode: string;
  name: string;
  price: number;
  
  // Quan trọng: Backend lưu date trong object lồng nhau
  dates: {
    mfg: string; // Ngày thu hoạch
    exp: string; // Hạn sử dụng
  };

  // farmId: Khi gửi lên là string, khi nhận về là object (nếu populate)
  farmId: string | IFarm;
  
  status: 'Available' | 'Sold' | 'Expired' | 'Harvested';
  description?: string;
  imageUrl?: string;
  totalScans?: number;
}