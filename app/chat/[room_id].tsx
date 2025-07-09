import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Button,
} from "react-native";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";
import { socket } from "@/lib/socket";

export default function ChatRoomScreen() {
  const { room_id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!room_id) return;

    const setupSocket = async () => {
      const token = await getToken();

      await loadMessages(room_id as string); // Загрузка сообщений

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("mobile_join", { room_id, token });

      socket.on("new_message", (msg) => {
        if (msg.room_id === room_id) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    };

    setupSocket();

    return () => {
      socket.off("new_message");
      // Убираем disconnect, чтобы не ломать соединение
    };
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = await getToken();

    const payload = {
      room_id,
      content: input.trim(),
      token,
    };

    console.log("📤 Отправка сообщения:", payload);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("mobile_send_message", payload);

    setInput("");
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
        <>
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={
              <Text style={styles.empty}>Сообщений пока нет</Text>
            }
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Введите сообщение"
            />
            <Button title="Отправить" onPress={sendMessage} />
          </View>
        </>
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
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#aaa",
    marginRight: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
