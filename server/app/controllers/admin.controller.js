const path = require("path");
const fs = require("fs");
const readline = require("readline"); // Thư viện đọc file theo dòng
const db = require("../models");
const Product = db.products;

// Cấu hình
const BACKUP_DIR = path.join(__dirname, "../../backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);
// Đổi đuôi file thành .jsonl (JSON Lines) - Mỗi dòng là 1 object JSON
const BACKUP_FILE = path.join(BACKUP_DIR, "agri_db_bigdata.jsonl"); 

// --- 1. BACKUP (STREAMING WRITE) ---
exports.backup = async (req, res) => {
  console.log("⚡ [BACKUP] Đang bắt đầu Streaming Backup...");
  
  try {
    const writeStream = fs.createWriteStream(BACKUP_FILE);
    
    // Sử dụng Cursor: Đọc dữ liệu từ MongoDB từng cái một, không load hết vào RAM
    const cursor = Product.find({}).lean().cursor();

    let count = 0;
    
    // Duyệt qua từng document bằng cursor
    for await (const doc of cursor) {
      // Chuyển object thành string và ghi vào file + xuống dòng
      const line = JSON.stringify(doc) + "\n";
      
      // Kiểm tra xem buffer có đầy không để chờ (tránh tràn RAM khi ghi file)
      if (!writeStream.write(line)) {
        await new Promise(resolve => writeStream.once('drain', resolve));
      }
      count++;
    }

    writeStream.end();

    console.log(`✅ [BACKUP SUCCESS] Đã ghi ${count} dòng.`);
    res.json({ 
      success: true, 
      log: `✅ BACKUP STREAMING THÀNH CÔNG!\n📁 File: .jsonl (JSON Lines)\n📊 Số lượng: ${count.toLocaleString()} bản ghi.\n🚀 RAM Usage: Tối ưu (<50MB).` 
    });

  } catch (error) {
    console.error("❌ [BACKUP ERROR]", error);
    res.status(500).json({ success: false, log: `Lỗi: ${error.message}` });
  }
};

// --- 2. RESTORE (STREAMING READ & BATCH INSERT) ---
exports.restore = async (req, res) => {
  console.log("⚡ [RESTORE] Đang bắt đầu Streaming Restore...");

  if (!fs.existsSync(BACKUP_FILE)) {
    return res.status(400).json({ success: false, log: "❌ Không tìm thấy file backup (.jsonl)!" });
  }

  try {
    // Bước 1: Xóa sạch dữ liệu cũ
    console.log("🧹 Đang xóa dữ liệu cũ...");
    await Product.deleteMany({});
    
    // Bước 2: Đọc file theo dòng (Line by Line)
    const fileStream = fs.createReadStream(BACKUP_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let batch = [];
    const BATCH_SIZE = 2000; // Mỗi lần nạp 2000 dòng vào DB
    let totalRestored = 0;

    for await (const line of rl) {
      if (!line.trim()) continue; // Bỏ qua dòng trống

      try {
        const doc = JSON.parse(line);
        batch.push(doc);
      } catch (e) {
        console.warn("⚠️ Bỏ qua dòng lỗi JSON");
      }

      // Khi đủ gói 2000 dòng thì ghi xuống DB 1 lần
      if (batch.length >= BATCH_SIZE) {
        await Product.insertMany(batch);
        totalRestored += batch.length;
        process.stdout.write(`\r⏳ Đang phục hồi: ${totalRestored.toLocaleString()} bản ghi...`);
        batch = []; // Xả bộ nhớ
      }
    }

    // Ghi nốt số còn dư
    if (batch.length > 0) {
      await Product.insertMany(batch);
      totalRestored += batch.length;
    }

    console.log("\n✅ [RESTORE SUCCESS]");
    res.json({ 
      success: true, 
      log: `✅ RESTORE STREAMING THÀNH CÔNG!\n🔄 Đã khôi phục: ${totalRestored.toLocaleString()} bản ghi.\n🚀 Kỹ thuật: Batch Processing (${BATCH_SIZE}/lần).` 
    });

  } catch (error) {
    console.error("❌ [RESTORE ERROR]", error);
    res.status(500).json({ success: false, log: `Lỗi: ${error.message}` });
  }
};