// app/expenses.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/expenses/add")}>
        <Text style={styles.addButtonText}>➕ Добавить чек</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.text}>🧾 Список расходов</Text>
        {/* Здесь позже будет список чеков */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  text: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
  },
});
