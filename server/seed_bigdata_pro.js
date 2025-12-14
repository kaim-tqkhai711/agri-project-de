const db = require("./app/models");
const { faker } = require('@faker-js/faker');

const Account = db.accounts;
const Farm = db.farms;
const Product = db.products;
const ScanLog = db.scanlogs;
const AuditLog = db.auditlogs; // Model mới thêm

// Cấu hình số lượng
const NUM_PRODUCTS = 1000000; // 1 Triệu dòng
const BATCH_SIZE = 5000;      // Ghi mỗi lần 5000 dòng để tối ưu RAM

// Kết nối DB
db.mongoose
  .connect(db.url)
  .then(() => {
    console.log("✅ Đã kết nối MongoDB.");
    console.log("🚀 Bắt đầu quy trình Seed Big Data (Phiên bản Physical Design 5 Collection)...");
    runSeed();
  })
  .catch(err => {
    console.log("❌ Lỗi kết nối:", err);
    process.exit();
  });

async function runSeed() {
  try {
    // --- BƯỚC 1: DỌN DẸP DỮ LIỆU CŨ ---
    console.log("\n🧹 1. Đang xóa dữ liệu cũ (Clean up)...");
    await Account.deleteMany({});
    await Farm.deleteMany({});
    await Product.deleteMany({});
    await ScanLog.deleteMany({});
    await AuditLog.deleteMany({});
    console.log("   -> Đã xóa sạch 5 Collections.");

    // --- BƯỚC 2: TẠO ACCOUNT (Admin & FarmOwner) ---
    console.log("👤 2. Đang tạo Accounts...");
    
    // Tạo Admin
    const admin = await Account.create({
        username: "admin",
        email: "admin@gmail.com",
        password: "123", // Trong thực tế nên hash password
        role: "Admin",
        status: "Active",
        profile: { // Embedding Profile
            fullName: "Super Admin",
            phone: "0900000001",
            address: "Hệ thống trung tâm",
            avatar: faker.image.avatar()
        }
    });

    // Tạo Chủ nông trại
    const farmOwner = await Account.create({
        username: "farm_owner",
        email: "owner@gmail.com",
        password: "123",
        role: "FarmOwner",
        status: "Active",
        profile: {
            fullName: "Nguyễn Văn Chủ Trại",
            phone: "0900000002",
            address: "Đồng Tháp",
            avatar: faker.image.avatar()
        }
    });
    console.log("   -> Đã tạo Admin & FarmOwner.");

    // --- BƯỚC 3: TẠO FARM (Có nhúng Certifications) ---
    console.log("🏡 3. Đang tạo 10 Nông trại mẫu...");
    const farms = [];
    
    for (let i = 0; i < 10; i++) {
        const farm = await Farm.create({
            name: `Nông Trại ${faker.location.city()}`,
            ownerAccountId: farmOwner._id,
            owner: farmOwner.profile.fullName, // Denormalization để hiển thị nhanh
            vietGapCode: `VG-2025-${1000 + i}`,
            status: "Active",
            // Embedding Certifications (Theo thiết kế mới)
            certifications: [
                {
                    name: "VietGAP",
                    code: `VG-${faker.string.alphanumeric(8).toUpperCase()}`,
                    issuedBy: "Cục Trồng Trọt",
                    validTo: faker.date.future()
                },
                {
                    name: "GlobalGAP",
                    code: `GG-${faker.string.alphanumeric(8).toUpperCase()}`,
                    issuedBy: "Tổ chức Quốc tế",
                    validTo: faker.date.future()
                }
            ],
            contactInfo: {
                address: faker.location.streetAddress(),
                phone: faker.phone.number(),
                email: faker.internet.email()
            }
        });
        farms.push(farm._id);
    }
    console.log("   -> Đã tạo xong 10 Nông trại.");

    // --- BƯỚC 4: TẠO 1 TRIỆU SẢN PHẨM (BIG DATA) ---
    console.log(`📦 4. Đang sinh ${NUM_PRODUCTS.toLocaleString()} Sản phẩm... (Vui lòng đợi 1-2 phút)`);
    
    let productsBuffer = [];
    for (let i = 0; i < NUM_PRODUCTS; i++) {
        const mfg = faker.date.past();
        const exp = new Date(mfg);
        exp.setMonth(exp.getMonth() + 6); // Hạn 6 tháng

        productsBuffer.push({
            qrCode: `PROD-${i}-${faker.string.alphanumeric(5)}`, // Unique QR
            name: faker.commerce.productName(),
            price: parseFloat(faker.commerce.price({ min: 10000, max: 500000 })),
            farmId: farms[Math.floor(Math.random() * farms.length)], // Random Farm
            status: "Available",
            // Gộp thông tin Batch vào đây (Denormalization)
            dates: {
                mfg: mfg,
                exp: exp
            },
            totalScans: Math.floor(Math.random() * 50)
        });

        // Ghi xuống DB theo Batch (để không tràn RAM)
        if (productsBuffer.length === BATCH_SIZE) {
            await Product.insertMany(productsBuffer);
            productsBuffer = []; // Reset buffer
            
            // Hiển thị tiến độ
            const percent = ((i + 1) / NUM_PRODUCTS * 100).toFixed(1);
            process.stdout.write(`\r   ⏳ Progress: ${percent}% (${(i + 1).toLocaleString()} records)`);
        }
    }
    
    // Ghi nốt số còn dư (nếu có)
    if (productsBuffer.length > 0) {
        await Product.insertMany(productsBuffer);
    }
    console.log("\n   -> ✅ HOÀN TẤT 1 TRIỆU SẢN PHẨM.");

    // --- BƯỚC 5: TẠO AUDIT LOG MẪU ---
    console.log("📝 5. Đang tạo Audit Logs mẫu...");
    await AuditLog.create({
        action: "SYSTEM_INIT",
        entity: "system",
        entityId: "ROOT",
        performedBy: admin._id,
        details: "Khởi tạo dữ liệu mẫu Big Data thành công."
    });
    console.log("   -> Đã tạo Audit Log.");

    console.log("\n🎉 --- SEEDING COMPLETED SUCCESSFULLY --- 🎉");
    process.exit();

  } catch (error) {
    console.error("\n❌ Lỗi nghiêm trọng:", error);
    process.exit();
  }
}