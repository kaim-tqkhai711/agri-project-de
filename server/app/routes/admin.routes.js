const { verifyToken, isAdmin } = require("../middlewares/authJwt");
const adminController = require("../controllers/admin.controller.js"); // 1. Đặt tên rõ ràng

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // --- API Backup ---
  // 2. Sửa "controller" thành "adminController"
  app.post(
    "/api/admin/backup", 
    [verifyToken, isAdmin], // Middleware bảo vệ
    adminController.backup
  );

  // --- API Restore ---
  // 3. Sửa "controller" thành "adminController"
  app.post(
    "/api/admin/restore", 
    [verifyToken, isAdmin], // Middleware bảo vệ
    adminController.restore
  );

  // 4. Đã XÓA dòng app.use router bị thừa ở đây
};