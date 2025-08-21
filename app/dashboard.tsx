import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { getUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";

export default function DashboardScreen() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const registerPushToken = async () => {
      try {
        const user = await getUser();

        if (!user) return;
        setUserRole(user.role);

        if (user.role !== "driver" || !user.driver_id) return;

        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== "granted") {
          console.warn("❌ Push разрешение не выдано");
          return;
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: "1888630c-08e1-4ab5-8528-259646bbb501"
        });

        const url = `${API_URL}/api/drivers/${user.driver_id}/update_push_token`;

        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token || ""}`,
          },
          body: JSON.stringify({ expo_push_token: token }),
        });
      } catch (err) {
        console.warn("❌ Ошибка при регистрации push токена:", err);
      }
    };

    if (Device.isDevice && Platform.OS !== "web") {
      registerPushToken();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}> UWC Driver App</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={() => router.push("/chat")}>
          <Text style={styles.emoji}>💬</Text>
          <Text style={styles.cardText}>Чат</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/loads")}>
          <Text style={styles.emoji}>🚛</Text>
          <Text style={styles.cardText}>Грузы</Text>
        </TouchableOpacity>

        {userRole === "driver" && (
          <>
            <TouchableOpacity style={styles.card} onPress={() => router.push("/expenses")}>
              <Text style={styles.emoji}>🧾</Text>
              <Text style={styles.cardText}>My expenses</Text>
            </TouchableOpacity>

            {/* NEW: Statements */}
            <TouchableOpacity style={styles.card} onPress={() => router.push("/statements")}>
              <Text style={styles.emoji}>📑</Text>
              <Text style={styles.cardText}>Statements</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.card} onPress={() => router.push("/inspections")}>
          <Text style={styles.emoji}>🛡️</Text>
          <Text style={styles.cardText}>Add DOT Inspection</Text>
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
