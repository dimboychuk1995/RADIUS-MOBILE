export const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://9bce-73-72-97-139.ngrok-free.app";