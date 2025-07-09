// config.ts

export const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://192.168.0.229:5000"
    : "https://3b95522a1c03.ngrok-free.app";