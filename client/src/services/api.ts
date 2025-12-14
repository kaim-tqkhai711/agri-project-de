// src/services/api.ts
import axios from "axios";

const IP_MAY_TINH = "192.168.1.12";

const api = axios.create({
  // Địa chỉ Backend Node.js của bạn
  baseURL: "http://192.168.1.12:8080/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;