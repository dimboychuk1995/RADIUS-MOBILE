import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getUser() {
  const json = await AsyncStorage.getItem("user");
  return json ? JSON.parse(json) : null;
}

export async function setUser(user: any) {
  await AsyncStorage.setItem("user", JSON.stringify(user));
}

export async function clearUser() {
  await AsyncStorage.removeItem("user");
}

// ✅ Добавляем получение JWT токена
export async function getToken() {
  const json = await AsyncStorage.getItem("user");
  const user = json ? JSON.parse(json) : null;
  return user?.token || null;
}
