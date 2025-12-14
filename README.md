# 🌾 AgriTrace - Hệ Thống Truy Xuất Nguồn Gốc Nông Sản (Big Data System)

![AgriTrace Banner](https://via.placeholder.com/1000x300?text=AgriTrace+Big+Data+Project)

> **Đồ án môn học:** Data Engineering / Big Data
> **Quy mô:** Xử lý và vận hành trên tập dữ liệu **1,000,000+ bản ghi**.
> **Điểm nhấn công nghệ:** Streaming ETL, Aggregation Pipeline, Advanced Indexing.

---

## 📖 Giới thiệu

**AgriTrace** là giải pháp phần mềm toàn diện giúp minh bạch hóa thông tin nông sản từ nông trại đến bàn ăn. Khác với các hệ thống CRUD thông thường, AgriTrace tập trung giải quyết các thách thức của **Big Data (Volume)**:
1.  **Tốc độ:** Truy vấn dữ liệu cực nhanh trên tập dữ liệu triệu dòng.
2.  **Hiệu năng:** Tính toán thống kê thời gian thực mà không làm treo hệ thống.
3.  **Độ bền vững:** Cơ chế Sao lưu/Phục hồi (Backup/Restore) luồng (Streaming) giúp tiết kiệm RAM tối đa.

---

## 🚀 Tính năng nổi bật

### 1. Phân hệ Người dùng (End-User)
- 📷 **Quét mã QR (Camera):** Sử dụng Webcam/Camera điện thoại để quét mã sản phẩm trực tiếp.
- 📂 **Upload ảnh QR:** Hỗ trợ tải ảnh mã QR lên để hệ thống tự động giải mã.
- 📄 **Thông tin minh bạch:** Hiển thị chi tiết nông trại, quy trình VietGAP, ngày thu hoạch, hạn sử dụng.

### 2. Phân hệ Quản trị (Admin Dashboard)
- 📊 **Analytics Dashboard:** Thống kê tổng quan (Doanh thu, Tồn kho, Tỉ lệ hỏng) dựa trên dữ liệu lớn (Aggregation).
- 🛠 **Data Engineering Tools:**
    - **Generate Mock Data:** Sinh tự động 1 triệu bản ghi để test hiệu năng.
    - **Backup Database:** Sao lưu dữ liệu ra file JSONL (Streaming).
    - **Restore Database:** Phục hồi dữ liệu an toàn (Batch Processing).
- 📦 **Quản lý sản phẩm:** Quản lý vòng đời sản phẩm (Tạo mới -> Đang bán -> Đã bán).

### 3. Kỹ thuật Data Engineering (Điểm nhấn) 🌟
Hệ thống áp dụng 5 kỹ thuật nâng cao để xử lý **Volume (1 Triệu dòng)**:

1.  **Chiến lược Indexing (Indexing Strategy):**
    - Sử dụng *Text Index* cho tìm kiếm: Giảm thời gian từ `2000ms` xuống `<100ms`.
    - Sử dụng *Compound Index* cho bộ lọc đa điều kiện.
2.  **Aggregation Pipeline:** Chuyển toàn bộ toán tử tính toán (`$sum`, `$avg`, `$group`) về phía Database Server để giảm tải RAM cho Backend.
3.  **Streaming ETL:** Kỹ thuật Backup/Restore bằng luồng dữ liệu (Streams) giúp xử lý file dung lượng lớn mà **không tràn RAM (Heap Out Of Memory)**.
4.  **Tối ưu hóa Truy vấn (Query Optimization):** Áp dụng `Lean Query`, `Projection` và `Pagination` để tăng tốc độ phản hồi API gấp 5 lần.
5.  **Bảo mật nâng cao (Security Hardening):**
    - Cơ chế chống tấn công **NoSQL Injection** (Input Sanitization).
    - Chống tấn công **ReDoS** (Regex Denial of Service).
    - Bảo vệ HTTP Headers với **Helmet** và cấu hình **Strict CORS**.

---

## 🛠️ Công nghệ sử dụng

| Phân hệ | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Backend** | Node.js, Express.js | RESTful API, Stream API |
| **Database** | MongoDB | Mongoose ODM, Aggregation Framework |
| **Frontend** | ReactJS (Vite) | Tailwind CSS, Lucide Icons, QR Scanner |
| **Testing** | Jest, Supertest | Automation Testing, Unit & Integration Test |
| **Tools** | MongoDB Compass | Database Management |

---

## ⚙️ Cài đặt và Hướng dẫn chạy

Hãy đảm bảo máy tính đã cài đặt **Node.js (v18+)** và **MongoDB**.

### Bước 1: Cài đặt & Chạy Backend
Mở terminal tại thư mục gốc dự án:

```bash
cd server
npm install

# Khởi chạy Server (Port mặc định: 8081)
node server.js

### Bước 2: Cài đặt & Chạy Frontend

Mở một terminal mới (giữ nguyên terminal Backend đang chạy):

```bash 

cd client
npm install

# Khởi chạy giao diện phát triển
npm run dev

Mở trình duyệt tại địa chỉ http://localhost:5173.

### Bước 3: Sinh dữ liệu Big Data
Để hệ thống có dữ liệu lớn (Volume) nhằm kiểm thử hiệu năng và các tính năng thống kê, hãy chạy script sinh 1 triệu bản ghi mẫu (đã có sẵn): 
```bash

# Tại terminal thư mục server
node seed_bigdata_pro.js

### Bước 4: Chạy Kiểm thử Tự động
Hệ thống đi kèm bộ kiểm thử tự động để đảm bảo tính đúng đắn của nghiệp vụ, bảo mật và khả năng chịu tải.

```Bash

# Tại terminal thư mục server
npm test

