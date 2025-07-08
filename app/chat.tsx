// app/chat.tsx

import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth"; // ты уже это вроде используешь

export default function ChatScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      console.log("🔑 TOKEN перед запросом:", token); // ← сюда добавь

      const res = await fetch(`${API_URL}/api/mobile/chat/rooms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      } else {
        console.warn("Ошибка загрузки чатов:", data.error);
      }
    } catch (err) {
      console.error("❌ Ошибка при fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => router.push(`/chat/${item._id}`)}
    >
      <Text style={styles.roomName}>{item.name || "Без названия"}</Text>
      {item.last_message && (
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message.sender_name}: {item.last_message.content}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Нет доступных чатов</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  roomItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  roomName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});
