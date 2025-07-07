import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function DashboardScreen() {
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
    elevation: 5, // для Android
    shadowColor: "#000", // для iOS
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
