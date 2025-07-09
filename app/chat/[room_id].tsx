// ChatRoomScreen.tsx
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";
import { socket } from "@/lib/socket";

export default function ChatRoomScreen() {
  const { room_id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!room_id) return;

    const setupSocket = async () => {
      const token = await getToken();
      await loadMessages(room_id as string);

      if (!socket.connected) socket.connect();
      socket.emit("mobile_join", { room_id, token });

      socket.on("new_message", (msg) => {
        if (msg.room_id === room_id) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(scrollToBottom, 100);
        }
      });
    };

    setupSocket();

    const keyboardListener = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      socket.off("new_message");
      keyboardListener.remove();
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
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("❌ Ошибка при загрузке сообщений:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 999999, animated: true });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const token = await getToken();
    socket.emit("mobile_send_message", { room_id, content: input.trim(), token });
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
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 93, android: 0 })}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToBottom}
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Введите сообщение"
                multiline
                returnKeyType="default"
              />
              <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                <Text style={styles.sendText}>➤</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageItem: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  sender: { fontWeight: "bold", marginBottom: 4 },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "flex-end",
    paddingBottom: Platform.select({ ios: 16, android: 8 }),
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#007bff",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
