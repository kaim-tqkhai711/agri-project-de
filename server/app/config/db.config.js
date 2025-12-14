require('dotenv').config(); // Load biến môi trường

module.exports = {
  // Ưu tiên lấy từ .env, nếu lỗi mới fallback về localhost
  url: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/agri_db"
};