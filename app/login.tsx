// app/login.tsx

import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { login } from "@/utils/api";
import { setUser } from "@/lib/auth";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const result = await login(username, password);

    if (result.success) {
      await setUser({
        user_id: result.user_id,
        role: result.role,
        username: result.username,
        company: result.company,
        token: result.token, // ⬅️ это обязательно
        driver_id: result.driver_id || null, // на всякий случай
      });
      router.replace("/dashboard");
    } else {
      Alert.alert("Ошибка входа", result.message || "Неверные данные");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>
      <TextInput
        style={styles.input}
        placeholder="Имя пользователя"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title="Войти" onPress={handleLogin} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f6f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
});