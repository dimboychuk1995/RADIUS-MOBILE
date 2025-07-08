export const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://192.168.0.229:5000"
    : "https://38f9244c3e57.ngrok-free.app";