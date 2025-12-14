const config = require("../config/auth.config");
const db = require("../models");
const Account = db.accounts;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  const account = new Account({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8), // Mã hóa mật khẩu
    role: req.body.role || "User" // Mặc định là Consumer (User)
  });

  try {
    await account.save();
    res.send({ message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(500).send({ message: err.message || "Lỗi đăng ký" });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await Account.findOne({ username: req.body.username });
    if (!user) return res.status(404).send({ message: "Không tìm thấy tài khoản." });

    // So sánh mật khẩu
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: "Sai mật khẩu!" });
    }

    // Tạo Token (hết hạn sau 24h)
    var token = jwt.sign({ id: user._id }, config.secret, { expiresIn: 86400 });

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  };
  
};
// Lấy thông tin cá nhân
exports.getProfile = async (req, res) => {
  try {
    // req.userId lấy từ middleware verifyToken
    const user = await Account.findById(req.userId).select("-password"); // Không trả về mật khẩu
    if (!user) return res.status(404).send({ message: "Không tìm thấy người dùng." });
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      email: req.body.email
    };

    // Nếu người dùng muốn đổi mật khẩu
    if (req.body.password) {
      updates.password = bcrypt.hashSync(req.body.password, 8);
    }

    const user = await Account.findByIdAndUpdate(req.userId, updates, { new: true }).select("-password");
    res.status(200).send({ message: "Cập nhật thành công!", user });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};