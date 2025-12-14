module.exports = app => {
  const products = require("../controllers/product.controller.js");
  const { verifyToken, isAdmin } = require("../middlewares/authJwt"); // Import Middleware
  
  var router = require("express").Router();

  // ==========================================
  // 1. CÁC ROUTE ĐẶC BIỆT 
  // ==========================================
  
  // API Thống kê Big Data (Phải đứng trước /:id)
  router.get("/analytics/general", products.getStatistics); 

  // ==========================================
  // 2. API CÔNG KHAI (PUBLIC - Ai cũng dùng được)
  // ==========================================
  
  // Lấy danh sách sản phẩm (có phân trang & search)
  router.get("/", products.findAll);

  // Lấy chi tiết 1 sản phẩm (Dùng cho người quét mã QR)
  // Lưu ý: Route này sẽ bắt tất cả các chuỗi sau /products/ (VD: /products/123)
  router.get("/:id", products.findOne);

  // ==========================================
  // 3. API BẢO MẬT (SECURED - Chỉ Admin mới dùng được)
  // ==========================================
  
  // Thêm mới sản phẩm (Kèm ghi AuditLog)
  router.post("/", [verifyToken, isAdmin], products.create);

  // Cập nhật sản phẩm
  router.put("/:id", [verifyToken, isAdmin], products.update);

  // Xóa 1 sản phẩm (Kèm ghi AuditLog)
  router.delete("/:id", [verifyToken, isAdmin], products.delete);

  // Xóa tất cả (Nguy hiểm -> Cần bảo vệ kỹ)
  router.delete("/", [verifyToken, isAdmin], products.deleteAll);

  app.use('/api/products', router);
};