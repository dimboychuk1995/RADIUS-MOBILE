import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { getUser } from "@/lib/auth";

// ПРИЁМ PUSH: грузы + стейтменты
import { initLoadNotifications } from "@/app/tools/notification/load_notifications";
import { initStatementNotifications } from "@/app/tools/notification/statement_notifications";

export default function DashboardScreen() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // подтягиваем пользователя для UI
    (async () => {
      const user = await getUser();
      if (user) setUserRole(user.role);
    })();

    // инициализируем пуш-уведомления (регистрация токена + слушатели)
    let unsubLoads: undefined | (() => void);
    let unsubStatements: undefined | (() => void);

    (async () => {
      // ГРУЗЫ → детальная
      unsubLoads = await initLoadNotifications((loadId) => {
        if (!loadId) return;
        router.push(`/load-details/${encodeURIComponent(loadId)}`);
      });

      // СТЕЙТМЕНТЫ → список с якорями (open / week)
      unsubStatements = await initStatementNotifications((statementId, weekRange) => {
        if (statementId) {
          const query = `open=${encodeURIComponent(statementId)}${
            weekRange ? `&week=${encodeURIComponent(weekRange)}` : ""
          }`;
          router.push(`/statements?${query}`);
        } else if (weekRange) {
          router.push(`/statements?week=${encodeURIComponent(weekRange)}`);
        } else {
          router.push(`/statements`);
        }
      });
    })();

    return () => {
      if (unsubLoads) unsubLoads();
      if (unsubStatements) unsubStatements();
    };
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
