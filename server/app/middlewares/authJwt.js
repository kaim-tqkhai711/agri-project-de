const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const Account = db.accounts;

// 1. Kiểm tra Token có hợp lệ không
verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"]; // Lấy token từ Header

  if (!token) {
    return res.status(403).send({ message: "Không tìm thấy Token xác thực!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
    req.userId = decoded.id; // Lưu ID người dùng vào request để dùng sau
    next();
  });
};

// 2. Kiểm tra quyền Admin
isAdmin = async (req, res, next) => {
  try {
    const user = await Account.findById(req.userId);
    if (user.role === "Admin") {
      next();
      return;
    }
    res.status(403).send({ message: "Yêu cầu quyền Admin!" });
  } catch (err) {
    res.status(500).send({ message: err });
  }
};

// 3. Kiểm tra quyền Farm Owner hoặc Admin
isFarmOwnerOrAdmin = async (req, res, next) => {
  try {
    const user = await Account.findById(req.userId);
    if (user.role === "FarmOwner" || user.role === "Admin") {
      next();
      return;
    }
    res.status(403).send({ message: "Yêu cầu quyền Chủ Nông Trại!" });
  } catch (err) {
    res.status(500).send({ message: err });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isFarmOwnerOrAdmin
};
module.exports = authJwt;