import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { usePathname, useRouter } from "expo-router";
import { useAuthGuard } from "@/lib/guard";
import { clearUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import { getUser } from "@/lib/auth";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthGuard();

  const [isModalVisible, setModalVisible] = useState(false);
  const showSettingsIcon = isAuthenticated && pathname !== "/settings";

  const toggleModal = () => setModalVisible(!isModalVisible);

  const handleChangePassword = () => {
    setModalVisible(false);
    router.push("/settings");
  };

  const handleLogout = async () => {
    setModalVisible(false);
    try {
      const user = await getUser();
      if (user?.role === "driver" && user?.driver_id && user?.token) {
        await fetch(`${API_URL}/api/drivers/${user.driver_id}/clear_push_token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }).catch(() => {});
      }
    } finally {
      await clearUser();
      router.replace("/login");
    }
  };

  if (isAuthenticated === null) return null;

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
  modal: { justifyContent: "flex-end", margin: 0 },
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
