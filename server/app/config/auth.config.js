module.exports = {
  // Đọc secret key từ file .env
  secret: process.env.JWT_SECRET || "fallback-secret-key-if-env-missing"
};