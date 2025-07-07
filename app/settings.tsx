// app/settings.tsx
import { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";

export default function SettingsScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "67e8c87cbd2c1968f931e193", // ← временно хардкод для проверки
          currentPassword,
          newPassword
        }),
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("Успех", "Пароль успешно изменен");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        Alert.alert("Ошибка", data.message || "Ошибка при смене пароля");
      }
    } catch (err) {
      Alert.alert("Ошибка", "Сетевая ошибка");
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Сменить пароль</Text>

      <TextInput
        style={styles.input}
        placeholder="Текущий пароль"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Новый пароль"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Button title="Сменить" onPress={handleChangePassword} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10, marginBottom: 15 },
});
