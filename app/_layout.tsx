import { Stack, useRouter, usePathname } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const [isModalVisible, setModalVisible] = useState(false);
  const showSettingsIcon = pathname !== "/(auth)/login";

  const toggleModal = () => setModalVisible(!isModalVisible);

  const handleChangePassword = () => {
    setModalVisible(false);
    router.push("/settings");
  };

  const handleLogout = () => {
    setModalVisible(false);
    // Здесь очистка токена/стейта и переход на логин:
    router.replace("/(auth)/login");
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerRight: () =>
            showSettingsIcon ? (
              <Pressable onPress={toggleModal} style={{ marginRight: 15 }}>
                <Ionicons name="settings-outline" size={24} color="black" />
              </Pressable>
            ) : null,
        }}
      />

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onBackButtonPress={toggleModal}
        style={styles.modal}
        swipeDirection="down"
        onSwipeComplete={toggleModal}
        backdropOpacity={0.3}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <TouchableOpacity onPress={handleChangePassword} style={styles.option}>
            <Ionicons name="key-outline" size={20} color="black" style={styles.icon} />
            <Text style={styles.optionText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.option}>
            <Ionicons name="log-out-outline" size={20} color="red" style={styles.icon} />
            <Text style={[styles.optionText, { color: "red" }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    minHeight: "40%",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  optionText: {
    fontSize: 16,
  },
  icon: {
    marginRight: 12,
  },
});
