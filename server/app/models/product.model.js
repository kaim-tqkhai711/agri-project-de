module.exports = mongoose => {
  const schema = mongoose.Schema(
    {
      // --- 1. KỸ THUẬT CHUẨN HÓA (DATA NORMALIZATION) ---
      // Thay vì lưu string, ta lưu ObjectId tham chiếu sang collection 'farms'
      // Giúp giảm dư thừa dữ liệu và đảm bảo tính nhất quán (Consistency)
      farmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'farm', 
        required: true
      },

      qrCode: { 
        type: String, 
        required: true, 
        unique: true, // Tự động tạo Index Unique (Duy nhất)
        trim: true 
      },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      
      dates: {
        mfg: { type: Date, required: true },
        exp: { type: Date, required: true }
      },

      status: { 
        type: String, 
        enum: ['Available', 'Sold', 'Expired', 'Harvested'],
        default: 'Available' 
      },
      
      description: String,
      totalScans: { type: Number, default: 0 }
    },
    { timestamps: true } // Tự động tạo createdAt, updatedAt
  );

  // --- 3. KỸ THUẬT ĐÁNH CHỈ MỤC (INDEXING) ---
  
  // A. Text Index: Giúp tìm kiếm từ khóa "Xoài Cát" trong 1 triệu dòng cực nhanh
  schema.index({ name: 'text', description: 'text' });

  // B. Compound Index: Tối ưu khi lọc theo nhiều điều kiện cùng lúc (VD: Tìm hàng 'Available' của 'Farm A')
  schema.index({ farmId: 1, status: 1 });

  // C. Single Index: Tối ưu sắp xếp theo ngày tạo (Khắc phục lỗi 500 Sort Memory)
  // (Mặc định _id có index nhưng tạo thêm createdAt để rõ ràng nếu cần sort theo ngày update)
  schema.index({ createdAt: -1 });

  return mongoose.model("product", schema);
};