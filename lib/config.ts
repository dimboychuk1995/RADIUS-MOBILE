// config.ts

export const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://192.168.0.229:5000"
    : "https://a877b235bbba.ngrok-free.app";