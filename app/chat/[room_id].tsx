import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

export default function ChatRoomScreen() {
  const { room_id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (room_id) {
      loadMessages(room_id as string);
    }
  }, [room_id]);

  const loadMessages = async (roomId: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/mobile/chat/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      } else {
        console.warn("Ошибка загрузки сообщений:", data.error);
      }
    } catch (err) {
      console.error("❌ Ошибка при загрузке сообщений:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.messageItem}>
      <Text style={styles.sender}>{item.sender_name}</Text>
      <Text>{item.content}</Text>
      <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Сообщений пока нет</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageItem: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  sender: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    textAlign: "right",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
});
