const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const dbConfig = require("../app/config/db.config");
const db = require("../app/models");
const Product = db.products;

// Tạo thư mục chứa ảnh nếu chưa có
const OUTPUT_DIR = path.join(__dirname, "../../qr_test_images");
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR);
}

mongoose.connect(dbConfig.url)
  .then(async () => {
    console.log("🔌 Connected to DB. Generating QR Images...");
    
    // Lấy 10 sản phẩm mới nhất
    const products = await Product.find().limit(10).sort({ createdAt: -1 });

    if(products.length === 0) {
        console.log("❌ Không có sản phẩm nào để tạo mã!");
        process.exit();
    }

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const fileName = `test_qr_${i+1}.png`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        // Tạo file ảnh từ mã qrCode trong DB
        await QRCode.toFile(filePath, p.qrCode, {
            color: {
                dark: '#000000',  // Màu đen
                light: '#ffffff'  // Nền trắng
            },
            width: 300 // Kích thước ảnh
        });

        console.log(`✅ Created: ${fileName} -> Code: ${p.qrCode}`);
    }

    console.log(`\n🎉 HOÀN TẤT! Ảnh đã lưu tại thư mục: /qr_test_images`);
    process.exit();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });