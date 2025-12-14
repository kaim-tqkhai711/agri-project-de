const db = require("../models");
const Product = db.products;
const AuditLog = db.auditlogs; // Model ghi vết Admin
const ScanLog = db.scanlogs;   // Model ghi vết User

// --- HÀM PHỤ TRỢ: KHỬ KÝ TỰ ĐẶC BIỆT (CHỐNG ReDoS) ---
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

// ==========================================
// 1. CREATE (Tạo mới + Ghi AuditLog)
// ==========================================
exports.create = async (req, res) => {
  try {
    // Validate cơ bản
    if (!req.body.qrCode || !req.body.name) {
      return res.status(400).send({ message: "Mã QR và Tên sản phẩm là bắt buộc!" });
    }

    const product = new Product({
      qrCode: req.body.qrCode,
      name: req.body.name,
      price: req.body.price,
      dates: req.body.dates,
      farmId: req.body.farmId,
      status: req.body.status || "Available",
      description: req.body.description,
      totalScans: 0
    });

    const data = await product.save();

    // --- 📝 BIG DATA: Ghi Audit Log (Admin đã làm gì?) ---
    // Lưu ý: req.userId lấy từ Middleware authJwt
    await new AuditLog({
      action: "CREATE_PRODUCT",
      entity: "products",
      entityId: data._id,
      performedBy: req.userId, 
      details: { name: data.name, qrCode: data.qrCode }
    }).save();
    // ----------------------------------------------------

    res.send(data);

  } catch (err) {
    res.status(500).send({ message: err.message || "Lỗi khi tạo sản phẩm." });
  }
};

// ==========================================
// 2. RETRIEVE ALL (Tìm kiếm + Phân trang chuẩn Big Data)
// ==========================================
exports.findAll = async (req, res) => {
  try {
    const { qrCode, page, limit } = req.query;
    var condition = {};

    // --- 🛡️ BẢO MẬT: Chống NoSQL Injection (Chiến thuật Whitelist) ---
    if (qrCode) {
      // NẾU KHÔNG PHẢI LÀ CHUỖI -> CHẶN NGAY LẬP TỨC
      // (Bất kể là Object { $ne: null } hay Array hay gì đi nữa)
      if (typeof qrCode !== 'string') {
        console.warn("🚨 [SECURITY] Blocked Injection:", JSON.stringify(qrCode));
        return res.send([]); // Trả về mảng rỗng theo kỳ vọng của Test Case 05
      }

      // Nếu là chuỗi thì mới xử lý tiếp
      const safeQr = escapeRegExp(qrCode);
      condition.qrCode = { $regex: new RegExp(safeQr), $options: "i" };
    }

    // --- ⚡ TỐI ƯU: Phân trang (Pagination) ---
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

    // Trả về cấu trúc chuẩn
    res.send({
      data: products,
      pagination: {
        total: totalDocs,
        currentPage: pageNum,
        totalPages: Math.ceil(totalDocs / limitNum)
      }
    });

  } catch (err) {
    console.error("❌ [FIND ALL ERROR]", err);
    res.status(500).send({ message: "Lỗi Server." });
  }
};
// ==========================================
// 3. FIND ONE (Chi tiết + Ghi ScanLog)
// ==========================================
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Product.findById(id).populate('farmId');

    if (!data) 
      return res.status(404).send({ message: "Không tìm thấy sản phẩm id " + id });

    // --- 📡 BIG DATA: Ghi nhận hành vi người dùng (ScanLog) ---
    // Kỹ thuật "Fire & Forget": Không dùng await để trả kết quả cho User ngay lập tức
    new ScanLog({
      productId: id,
      qrCode: data.qrCode || "UNKNOWN",
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: req.headers['user-agent']
    }).save().catch(e => console.error("⚠️ Lỗi lưu ScanLog:", e.message));
    // ----------------------------------------------------------

    res.send(data);

  } catch (err) {
    res.status(500).send({ message: "Lỗi lấy chi tiết id=" + id });
  }
};

// ==========================================
// 4. UPDATE (Cập nhật + Ghi AuditLog)
// ==========================================
exports.update = async (req, res) => {
  if (!req.body) return res.status(400).send({ message: "Dữ liệu trống!" });
  const id = req.params.id;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { 
      useFindAndModify: false, 
      new: true // Trả về dữ liệu MỚI sau khi sửa
    });

    if (!updatedProduct) 
      return res.status(404).send({ message: `Không tìm thấy id=${id}!` });

    // --- 📝 Audit Log ---
    await new AuditLog({
      action: "UPDATE_PRODUCT",
      entity: "products",
      entityId: id,
      performedBy: req.userId,
      details: { changes: req.body } // Lưu lại những gì đã thay đổi
    }).save();

    res.send({ message: "Cập nhật thành công.", data: updatedProduct });

  } catch (err) {
    res.status(500).send({ message: "Lỗi update id=" + id });
  }
};

// ==========================================
// 5. DELETE (Xóa + Ghi AuditLog)
// ==========================================
exports.delete = async (req, res) => {
  const id = req.params.id;

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
// 6. DELETE ALL (Xóa tất cả + Cảnh báo)
// ==========================================
exports.deleteAll = async (req, res) => {
  try {
    const nums = await Product.deleteMany({});
    
    // --- 📝 Audit Log (Hành động nguy hiểm) ---
    await new AuditLog({
      action: "DELETE_ALL_PRODUCTS",
      entity: "products",
      entityId: "ALL",
      performedBy: req.userId,
      details: { count: nums.deletedCount }
    }).save();

    res.send({ message: `${nums.deletedCount} sản phẩm đã bị xóa!` });

  } catch (err) {
    res.status(500).send({ message: err.message || "Lỗi khi xóa tất cả." });
  }
};

// ==========================================
// 7. ANALYTICS (Thống kê Big Data)
// ==========================================
exports.getStatistics = async (req, res) => {
  console.log("⚡ [ANALYTICS] Aggregating Data...");
  
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