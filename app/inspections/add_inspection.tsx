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
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { getUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";

// Компонент модального TimePicker-а
function TimePickerModal({ visible, initialTime, onConfirm, onCancel }: {
  visible: boolean;
  initialTime: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
}) {
  const [tempTime, setTempTime] = useState(initialTime);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <DateTimePicker
            value={tempTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, selectedTime) => {
              if (selectedTime) setTempTime(selectedTime);
            }}
          />
          <TouchableOpacity
            onPress={() => onConfirm(tempTime)}
            style={modalStyles.confirmButton}
          >
            <Text style={modalStyles.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AddInspectionScreen() {
  const router = useRouter();

  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [timeFrom, setTimeFrom] = useState(new Date());
  const [showTimeFrom, setShowTimeFrom] = useState(false);

  const [timeTo, setTimeTo] = useState(new Date());
  const [showTimeTo, setShowTimeTo] = useState(false);

  const [stateText, setStateText] = useState("");

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleSubmit = async () => {
        try {
            const user = await getUser();
            if (!user?.token) throw new Error("Not authorized");

            const formData = new FormData();

            if (photo) {
            formData.append("file", {
                uri: photo.uri,
                name: "inspection.jpg",
                type: "image/jpeg",
            } as any);
            }

            formData.append("date", date.toISOString().split("T")[0]); // YYYY-MM-DD
            formData.append("start_time", timeFrom.toTimeString().slice(0, 5)); // HH:MM
            formData.append("end_time", timeTo.toTimeString().slice(0, 5));
            formData.append("state", stateText.trim());
            formData.append("clean_inspection", "true");
            formData.append("address", ""); // опционально
            formData.append("violations", JSON.stringify([])); // можно пустой массив

            const res = await fetch(`${API_URL}/api/mobile/inspections`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${user.token}`,
                // Не указываем Content-Type! Его задаст сам fetch с boundary
            },
            body: formData,
            });

            if (!res.ok) {
            const text = await res.text();
            throw new Error(`Submit error: ${text}`);
            }

            Alert.alert("✅ Успешно", "Инспекция сохранена");
            router.replace("/inspections");
        } catch (err: any) {
            Alert.alert("❌ Ошибка", err.message || "Ошибка при сохранении");
        }
        };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>➕ Add DOT Inspection</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickPhoto}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imageText}>📷 Upload Photo</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          value={date}
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>Time From</Text>
      <TouchableOpacity onPress={() => setShowTimeFrom(true)} style={styles.input}>
        <Text>{formatTime(timeFrom)}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Time To</Text>
      <TouchableOpacity onPress={() => setShowTimeTo(true)} style={styles.input}>
        <Text>{formatTime(timeTo)}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>State</Text>
      <TextInput
        placeholder="e.g. IL"
        value={stateText}
        onChangeText={setStateText}
        style={styles.input}
        autoCapitalize="characters"
      />

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitText}>💾 Save</Text>
      </TouchableOpacity>

      {/* Модалки */}
      <TimePickerModal
        visible={showTimeFrom}
        initialTime={timeFrom}
        onConfirm={(t) => {
          setTimeFrom(t);
          setShowTimeFrom(false);
        }}
        onCancel={() => setShowTimeFrom(false)}
      />

      <TimePickerModal
        visible={showTimeTo}
        initialTime={timeTo}
        onConfirm={(t) => {
          setTimeTo(t);
          setShowTimeTo(false);
        }}
        onCancel={() => setShowTimeTo(false)}
      />
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
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f4f6f9",
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
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
    marginTop: 30,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelText: {
    color: "#999",
    marginTop: 10,
    fontSize: 14,
  },
});
