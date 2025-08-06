import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";

export default function AddInspection() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛡️ Add DOT Inspection</Text>

      <Text style={styles.label}>Photo (coming soon)</Text>

      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} placeholder="MM/DD/YYYY" />

      <Text style={styles.label}>Time From</Text>
      <TextInput style={styles.input} placeholder="HH:MM" />

      <Text style={styles.label}>Time To</Text>
      <TextInput style={styles.input} placeholder="HH:MM" />

      <Text style={styles.label}>State</Text>
      <TextInput style={styles.input} placeholder="e.g. IL" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
});
