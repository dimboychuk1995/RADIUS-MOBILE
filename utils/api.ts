import { API_URL } from "@/lib/config";

export async function login(username: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    return data;
  } catch (err) {
    console.error("Ошибка при логине:", err);
    return { success: false, message: "Ошибка запроса" };
  }
}
