import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { getUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";

export default function DashboardScreen() {
  useEffect(() => {
    const registerPushToken = async () => {
      try {
        console.log("🟡 useEffect: registerPushToken вызван");

        const user = await getUser();
        console.log("👤 Получен user:", user);

        if (!user || user.role !== "driver" || !user.driver_id) {
          console.log("ℹ️ Не водитель или нет driver_id — пропускаем push регистрацию");
          return;
        }

        const { status } = await Notifications.requestPermissionsAsync();
        console.log("🔐 Push permission status:", status);

        if (status !== "granted") {
          console.warn("❌ Push разрешение не выдано");
          return;
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: "1888630c-08e1-4ab5-8528-259646bbb501"
        });
        console.log("📱 Получен Push token:", token);

        const url = `${API_URL}/api/drivers/${user.driver_id}/update_push_token`;
        console.log("🌐 Отправляем токен на:", url);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token || ""}`,
          },
          body: JSON.stringify({ expo_push_token: token }),
        });

        const text = await res.text();
        console.log("📬 Ответ сервера:", text);
      } catch (err) {
        console.warn("❌ Ошибка при регистрации push токена:", err);
      }
    };

    if (Device.isDevice && Platform.OS !== "web") {
      registerPushToken();
    } else {
      console.log("⚠️ Не устройство или web — push не регистрируется");
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Главное меню</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={() => router.push("/chat")}>
          <Text style={styles.emoji}>💬</Text>
          <Text style={styles.cardText}>Чат</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/loads")}>
          <Text style={styles.emoji}>🚛</Text>
          <Text style={styles.cardText}>Грузы</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/expenses")}>
          <Text style={styles.emoji}>🧾</Text>
          <Text style={styles.cardText}>Добавить инвойс</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 20,
  },
  card: {
    width: "45%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});
