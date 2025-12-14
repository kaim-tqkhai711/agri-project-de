export default function authHeader() {
  const userStr = localStorage.getItem("user");
  let user = null;
  if (userStr) {
    user = JSON.parse(userStr);
  }

  if (user && user.accessToken) {
    // Quan trọng: Backend của bạn (Node.js) đang đợi header tên là 'x-access-token'
    return { 'x-access-token': user.accessToken };
  } else {
    return { 'x-access-token': '' }; // Trả về rỗng để TS không báo lỗi
  }
}