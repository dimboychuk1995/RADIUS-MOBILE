// ChatRoomScreen.tsx
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
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
  Alert,
} from "react-native";
import { API_URL } from "@/lib/config";
import { getToken, getUser } from "@/lib/auth";
import { socket } from "@/lib/socket";

export default function ChatRoomScreen() {
  const { room_id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [messageIdToIndex, setMessageIdToIndex] = useState<{ [key: string]: number }>({});
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const scrollingToRef = useRef<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await getUser();
      setUser(u);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!room_id) return;

    const setupSocket = async () => {
      const token = await getToken();
      await loadMessages(room_id as string);

      if (!socket.connected) socket.connect();
      socket.emit("mobile_join", { room_id, token });

      socket.on("new_message", (msg) => {
        if (msg.room_id === room_id) {
          setMessages((prev) => {
            const newMessages = [...prev, msg];
            setMessageIdToIndex((prevMap) => ({
              ...prevMap,
              [msg._id]: newMessages.length - 1,
            }));
            return newMessages;
          });
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
        const mapping: { [key: string]: number } = {};
        data.messages.forEach((msg: any, idx: number) => {
          mapping[msg._id] = idx;
        });
        setMessageIdToIndex(mapping);
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

  const scrollToMessageById = (id: string) => {
    if (scrollingToRef.current === id) return;
    const index = messageIdToIndex[id];
    if (index !== undefined) {
      scrollingToRef.current = id;
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setHighlightedMessageId(id);
      setTimeout(() => {
        setHighlightedMessageId(null);
        scrollingToRef.current = null;
      }, 2000);
    } else {
      console.warn("🔍 Сообщение не найдено по ID:", id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const token = await getToken();
    socket.emit("mobile_send_message", {
      room_id,
      content: input.trim(),
      token,
      reply_to: replyTo?._id || null,
    });
    setInput("");
    setReplyTo(null);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.type === "success" && result.uri) {
        const token = await getToken();
        const formData = new FormData();
        formData.append("file", {
          uri: result.uri,
          name: result.name,
          type: result.mimeType || "application/octet-stream",
        } as any);
        formData.append("content", "");
        if (replyTo) formData.append("reply_to", JSON.stringify(replyTo));

        await fetch(`${API_URL}/api/mobile/chat/send/${room_id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        setReplyTo(null);
      }
    } catch (err) {
      console.error("❌ Ошибка при выборе файла:", err);
      Alert.alert("Ошибка", "Не удалось загрузить файл");
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === user?.user_id;
    const isHighlighted = highlightedMessageId === item._id;

    return (
      <TouchableOpacity onLongPress={() => setReplyTo(item)} activeOpacity={0.7}>
        <View
          style={[styles.messageItem, isOwn ? styles.ownMessage : styles.otherMessage, isHighlighted && styles.highlightedMessage]}
        >
          {item.reply_to && item.reply_to.message_id && (
            <View style={styles.replyBox}>
              <TouchableOpacity onPress={() => scrollToMessageById(item.reply_to.message_id)}>
                <Text style={styles.replySender}>🔗 Ответ для: {item.reply_to.sender_name}</Text>
              </TouchableOpacity>
              <Text style={styles.replySnippet} numberOfLines={1}>{item.reply_to.content}</Text>
            </View>
          )}
          <Text style={styles.sender}>{item.sender_name}</Text>
          <Text>{item.content}</Text>
          {item.files && item.files.length > 0 && (
            <View style={{ marginTop: 6 }}>
              {item.files.map((file: any, idx: number) => (
                <Text key={idx} style={{ color: "#007bff", textDecorationLine: "underline" }}>
                  📎 {file.file_name}
                </Text>
              ))}
            </View>
          )}
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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

            {replyTo && (
              <View style={styles.replyPreview}>
                <Text style={styles.replyLabel}>Ответ для: {replyTo.sender_name}</Text>
                <Text style={styles.replyContent} numberOfLines={1}>{replyTo.content}</Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Text style={{ color: "red", marginLeft: 8 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={pickFile} style={{ marginRight: 8 }}>
                <Text style={{ fontSize: 24 }}>📎</Text>
              </TouchableOpacity>
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
    borderRadius: 8,
    maxWidth: "80%",
  },
  ownMessage: {
    backgroundColor: "#d6ebff",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#f2f2f2",
    alignSelf: "flex-start",
  },
  highlightedMessage: {
    backgroundColor: "#fff7c2",
    borderWidth: 1,
    borderColor: "#ffd700",
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
  replyPreview: {
    padding: 8,
    backgroundColor: "#eee",
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
    marginHorizontal: 8,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  replyLabel: {
    fontWeight: "bold",
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
    color: "#333",
  },
  replyBox: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#aaa",
    marginBottom: 6,
  },
  replySender: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#007bff",
  },
  replySnippet: {
    fontSize: 12,
    color: "#333",
  },
});