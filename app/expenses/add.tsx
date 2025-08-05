import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";

export default function AddExpenseScreen() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("fuel");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      const user = await getUser();
      if (!user?.token) throw new Error("Вы не авторизованы");

      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("category", category);
      formData.append("note", note);
      formData.append("date", date.toISOString().split("T")[0]);

      if (image) {
        formData.append("photo", {
          uri: image.uri,
          name: "receipt.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${API_URL}/api/driver/expenses/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      Alert.alert("Успешно", "Чек добавлен");
      router.replace("/expenses");
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось сохранить чек");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>➕ Новый чек</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imageText}>📷 Загрузить фото</Text>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder="Сумма"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      <TextInput
        placeholder="Категория (fuel, toll, repair, food, other)"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <TextInput
        placeholder="Комментарий"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          value={date}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitText}>💾 Сохранить</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f4f6f9",
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  imagePicker: {
    backgroundColor: "#f4f6f9",
    height: 160,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    fontSize: 16,
    color: "#888",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
