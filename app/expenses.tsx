import { View, Text, StyleSheet } from "react-native";

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🧾 Страница расходов</Text>
      {/* Здесь будет список всех чеков */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
  },
});