import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { TimePickerModal } from "../tools/time_picker";

export default function AddInspectionScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [timeFrom, setTimeFrom] = useState(new Date());
  const [showTimeFromPicker, setShowTimeFromPicker] = useState(false);

  const [timeTo, setTimeTo] = useState(new Date());
  const [showTimeToPicker, setShowTimeToPicker] = useState(false);

  const [stateText, setStateText] = useState("");
  const [photo, setPhoto] = useState<any>(null);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛡️ Add DOT Inspection</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickPhoto}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imageText}>📷 Загрузить фото</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>Time From</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowTimeFromPicker(true)}
      >
        <Text>{formatTime(timeFrom)}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Time To</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowTimeToPicker(true)}
      >
        <Text>{formatTime(timeTo)}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>State</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. IL"
        value={stateText}
        onChangeText={setStateText}
        autoCapitalize="characters"
      />

      {/* Time Pickers */}
      <TimePickerModal
        visible={showTimeFromPicker}
        initialTime={timeFrom}
        onConfirm={(newTime) => {
          setTimeFrom(newTime);
          setShowTimeFromPicker(false);
        }}
        onCancel={() => setShowTimeFromPicker(false)}
      />
      <TimePickerModal
        visible={showTimeToPicker}
        initialTime={timeTo}
        onConfirm={(newTime) => {
          setTimeTo(newTime);
          setShowTimeToPicker(false);
        }}
        onCancel={() => setShowTimeToPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
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
});
