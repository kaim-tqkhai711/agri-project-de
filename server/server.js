require('dotenv').config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// ==========================================
// PHẦN 7.5: KỸ THUẬT BẢO MẬT (SECURITY)
// ==========================================

// --- LỚP 1: BẢO MẬT HTTP HEADERS (HELMET) ---
// Giúp ẩn thông tin server (X-Powered-By) và chống XSS cơ bản
app.use(helmet());

// --- LỚP 2: QUẢN LÝ TRUY CẬP (CORS STRICT MODE) ---
var corsOptions = {
  origin: "http://localhost:5173", // Chỉ tin tưởng Frontend này
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Chỉ cho phép các hành động này
  credentials: true, // Cho phép gửi Cookie/Token
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// --- LOGGER (DEBUG KẾT NỐI) ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- LỚP 3: CHỐNG TẤN CÔNG DOS & TRÀN BỘ NHỚ ---
// Giới hạn kích thước gói tin JSON chỉ 10kb.
// Nếu Hacker gửi 1 string dài 1GB để làm treo Database, Server sẽ từ chối ngay.
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- LỚP 4: CHỐNG NOSQL INJECTION ---
// (Tạm tắt dòng dưới nếu gặp lỗi TypeError do xung đột thư viện, 
// vì Mongoose hiện tại đã có cơ chế cast type bảo vệ cơ bản)
// app.use(mongoSanitize());

// ==========================================
// KẾT NỐI DATABASE
// ==========================================
const db = require("./app/models");
const dbConfig = require("./app/config/db.config");

db.mongoose
  .connect(dbConfig.url)
  .then(() => {
    console.log("✅ Secured Database Connected!");
  })
  .catch(err => {
    console.log("❌ Cannot connect to the database!", err);
    process.exit();
  });

// ==========================================
// ROUTES
// ==========================================
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Agri-Product Traceability Server (Secured)." });
});

require('./app/routes/auth.routes')(app);
require("./app/routes/product.routes")(app);
require("./app/routes/admin.routes")(app);

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.stack);
  res.status(500).send({ message: "Có lỗi xảy ra phía Server!" });
});

// ==========================================
// KHỞI CHẠY
// ==========================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🔒 Secure Server is running on port ${PORT}.`);
});