const mongoose = require("mongoose");
const db = require("../models");
const Product = db.products;
const AuditLog = db.auditlogs;
const ScanLog = db.scanlogs;

// --- HÀM PHỤ TRỢ: KHỬ KÝ TỰ ĐẶC BIỆT (CHỐNG ReDoS) ---
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

// --- HÀM PHỤ TRỢ: KIỂM TRA OBJECT ID (CHỐNG CastError) ---
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ==========================================
// 1. CREATE (Tạo mới + Validate chặt chẽ)
// ==========================================
exports.create = async (req, res) => {
  try {
    // 🛡️ SECURITY: Input Validation
    if (!req.body.qrCode || !req.body.name) {
      return res.status(400).send({ message: "Mã QR và Tên sản phẩm là bắt buộc!" });
    }

    // Kiểm tra giá tiền (phải là số và >= 0)
    if (req.body.price !== undefined) {
        if (typeof req.body.price !== 'number' || req.body.price < 0) {
            return res.status(400).send({ message: "Giá sản phẩm không hợp lệ!" });
        }
    }

    const product = new Product({
      qrCode: String(req.body.qrCode), // Ép kiểu String để an toàn
      name: String(req.body.name),
      price: req.body.price,
      dates: req.body.dates,
      farmId: req.body.farmId,
      status: req.body.status || "Available",
      description: req.body.description,
      totalScans: 0
    });

    const data = await product.save();

    // --- 📝 Audit Log ---
    await new AuditLog({
      action: "CREATE_PRODUCT",
      entity: "products",
      entityId: data._id,
      performedBy: req.userId, 
      details: { name: data.name, qrCode: data.qrCode }
    }).save();

    res.send(data);

  } catch (err) {
    res.status(500).send({ message: err.message || "Lỗi khi tạo sản phẩm." });
  }
};

// ==========================================
// 2. RETRIEVE ALL (FIXED: Strong Type Check Security)
// ==========================================
exports.findAll = async (req, res) => {
  try {
    // 🔍 DEBUG: In ra để xem Express đang parse cái URL thành cái gì
    console.log("👉 DEBUG req.query:", JSON.stringify(req.query));

    const { qrCode, name, page, limit } = req.query;
    var condition = {};

    // --- 🛡️ BẢO MẬT TẦNG 1: QUÉT SẠCH CÁC KEY ĐỘC HẠI ---
    // Kiểm tra xem có key nào chứa ký tự lạ như '$', '[', ']' không (Dấu hiệu Injection Flat Key)
    // Ví dụ: key là "qrCode[$ne]"
    const rawKeys = Object.keys(req.query);
    const hasInjectionSign = rawKeys.some(key => key.includes('$') || key.includes('[') || key.includes(']'));
    
    if (hasInjectionSign) {
        console.warn("🚨 [SECURITY] Blocked Flat-Key Injection");
        return res.send([]); // Trả về rỗng ngay lập tức
    }

    // --- 🛡️ BẢO MẬT TẦNG 2: KIỂM TRA KIỂU DỮ LIỆU (Object Injection) ---
    if (qrCode) {
      if (typeof qrCode === 'object') {
        console.warn("🚨 [SECURITY] Blocked Object Injection");
        return res.send([]);
      }
      const safeQr = escapeRegExp(String(qrCode));
      condition.qrCode = { $regex: new RegExp(safeQr), $options: "i" };
    }

    if (name) {
      if (typeof name === 'object') {
         return res.send([]);
      }
      const safeName = escapeRegExp(String(name));
      condition.name = { $regex: new RegExp(safeName), $options: "i" };
    }

    // --- ⚡ TỐI ƯU: Phân trang (Giữ nguyên) ---
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const products = await Product.find(condition)
      .select("-__v")
      .skip(skipNum)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .populate('farmId', 'name vietGapCode')
      .lean();

    const totalDocs = await Product.countDocuments(condition);

    res.send({
      data: products,
      pagination: {
        total: totalDocs,
        currentPage: pageNum,
        totalPages: Math.ceil(totalDocs / limitNum) || 0
      }
    });

  } catch (err) {
    console.error("❌ [FIND ALL ERROR]", err);
    res.status(500).send({ message: "Lỗi Server." });
  }
};

// ==========================================
// 3. FIND ONE (Validate ID + Ghi ScanLog)
// ==========================================
exports.findOne = async (req, res) => {
  const id = req.params.id;

  // 🛡️ SECURITY: Kiểm tra ID hợp lệ trước khi query DB
  if (!isValidId(id)) {
      return res.status(404).send({ message: "ID sản phẩm không hợp lệ!" });
  }

  try {
    const data = await Product.findById(id).populate('farmId');

    if (!data) 
      return res.status(404).send({ message: "Không tìm thấy sản phẩm id " + id });

    // --- 📡 ScanLog (Fire & Forget) ---
    new ScanLog({
      productId: id,
      qrCode: data.qrCode || "UNKNOWN",
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: req.headers['user-agent']
    }).save().catch(e => console.error("⚠️ Lỗi lưu ScanLog:", e.message));

    res.send(data);

  } catch (err) {
    res.status(500).send({ message: "Lỗi Server khi lấy chi tiết." });
  }
};

// ==========================================
// 4. UPDATE (Validate ID + AuditLog)
// ==========================================
exports.update = async (req, res) => {
  if (!req.body) return res.status(400).send({ message: "Dữ liệu trống!" });
  const id = req.params.id;

  // 🛡️ SECURITY: Validate ID
  if (!isValidId(id)) {
      return res.status(404).send({ message: "ID không hợp lệ!" });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { 
      useFindAndModify: false, 
      new: true 
    });

    if (!updatedProduct) 
      return res.status(404).send({ message: `Không tìm thấy id=${id}!` });

    // --- 📝 Audit Log ---
    await new AuditLog({
      action: "UPDATE_PRODUCT",
      entity: "products",
      entityId: id,
      performedBy: req.userId,
      details: { changes: req.body }
    }).save();

    res.send({ message: "Cập nhật thành công.", data: updatedProduct });

  } catch (err) {
    res.status(500).send({ message: "Lỗi update id=" + id });
  }
};

// ==========================================
// 5. DELETE (Validate ID + AuditLog)
// ==========================================
exports.delete = async (req, res) => {
  const id = req.params.id;

  // 🛡️ SECURITY: Validate ID
  if (!isValidId(id)) {
      return res.status(404).send({ message: "ID không hợp lệ!" });
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) 
      return res.status(404).send({ message: `Không tìm thấy id=${id}!` });

    // --- 📝 Audit Log ---
    await new AuditLog({
      action: "DELETE_PRODUCT",
      entity: "products",
      entityId: id,
      performedBy: req.userId,
      details: { name: deletedProduct.name, qrCode: deletedProduct.qrCode }
    }).save();

    res.send({ message: "Xóa thành công!" });

  } catch (err) {
    res.status(500).send({ message: "Lỗi xóa id=" + id });
  }
};

// ==========================================
// 6. DELETE ALL
// ==========================================
exports.deleteAll = async (req, res) => {
  try {
    const nums = await Product.deleteMany({});
    
    await new AuditLog({
      action: "DELETE_ALL_PRODUCTS",
      entity: "products",
      entityId: "ALL",
      performedBy: req.userId,
      details: { count: nums.deletedCount }
    }).save();

    res.send({ message: `${nums.deletedCount} sản phẩm đã bị xóa!` });

  } catch (err) {
    res.status(500).send({ message: "Lỗi khi xóa tất cả." });
  }
};

// ==========================================
// 7. ANALYTICS
// ==========================================
exports.getStatistics = async (req, res) => {
  try {
    const data = await Product.aggregate([
      {
        $group: {
          _id: null, 
          totalProducts: { $sum: 1 }, 
          avgPrice: { $avg: "$price" }, 
          minPrice: { $min: "$price" }, 
          maxPrice: { $max: "$price" }, 
          totalAvailable: { $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] } },
          totalSold: { $sum: { $cond: [{ $eq: ["$status", "Sold"] }, 1, 0] } }
        }
      }
    ]);

    const stats = data[0] || { totalProducts: 0, avgPrice: 0, totalAvailable: 0, totalSold: 0 };
    res.send(stats);

  } catch (err) {
    console.error("❌ [ANALYTICS ERROR]", err);
    res.status(500).send({ message: "Lỗi tính toán thống kê." });
  }
};