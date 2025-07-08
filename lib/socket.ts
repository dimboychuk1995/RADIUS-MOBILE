// socket.ts

import { io } from "socket.io-client";
import { API_URL } from "./config";

export const socket = io(API_URL, {
  transports: ["websocket"], // 📡 принудительно WebSocket
  autoConnect: false,        // 📴 вручную подключаем
});

// Логирование подключений (можно убрать в проде)
socket.on("connect", () => {
  console.log("✅ Socket подключен:", socket.id);
});

socket.on("disconnect", () => {
  console.log("⚠️ Socket отключён");
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connect_error:", err.message);
});