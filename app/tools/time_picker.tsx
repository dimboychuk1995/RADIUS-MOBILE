import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  visible: boolean;
  initialTime: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
};

export const TimePickerModal = ({
  visible,
  initialTime,
  onConfirm,
  onCancel,
}: Props) => {
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
};

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
