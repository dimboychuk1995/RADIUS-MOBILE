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
  Button,
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

          // 👇 Скроллим вниз на каждое новое сообщение
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });
    };

    setupSocket();

    const keyboardListener = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(scrollToBottom, 50);
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
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error("❌ Ошибка при загрузке сообщений:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 999999, animated: false });
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
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
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Введите сообщение"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <Button title="➤" onPress={sendMessage} />
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
