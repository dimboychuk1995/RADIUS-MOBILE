import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Button,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@/lib/config";
import { getUser } from "@/lib/auth";
import * as FileSystem from 'expo-file-system';

export default function LoadDetailsScreen() {
  const { load_id } = useLocalSearchParams();
  const [load, setLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!load_id) return;
    fetchDetails();
  }, [load_id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user?.token) {
        console.warn("Нет токена пользователя");
        return;
      }

      const res = await fetch(`${API_URL}/api/load/${load_id}`, {
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLoad(data.load);
      } else {
        console.warn("Ошибка:", data.error);
      }
    } catch (err) {
      console.error("Ошибка загрузки деталей:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderLocation = (title: string, data: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.text}>🏢 {data.company}</Text>
      <Text style={styles.text}>📍 {data.address}</Text>
      <Text style={styles.text}>📅 {formatDate(data.date)}</Text>
      {data.instructions ? <Text style={styles.text}>📄 {data.instructions}</Text> : null}
      {data.contact_phone_number ? <Text style={styles.text}>📞 {data.contact_phone_number}</Text> : null}
    </View>
  );

  const pickAndUploadPhotos = async (stage: "pickup" | "delivery") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    const user = await getUser();
    if (!user?.token) {
      Alert.alert("Ошибка", "Нет авторизации");
      return;
    }

    const formData = new FormData();
    formData.append("stage", stage);

    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i];
      const fileUri = asset.uri;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) continue;

      const fileName = `photo_${i}.jpg`;
      formData.append("photos", {
        uri: fileUri,
        name: fileName,
        type: "image/jpeg",
      } as any);
    }

    try {
      const res = await fetch(`${API_URL}/api/loads/${load_id}/upload_photos`, {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${user.token}`,
          // ВНИМАНИЕ: НЕ указывать Content-Type, fetch сам добавит boundary
        },
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("✅ Успех", "Фото загружены");
        fetchDetails();
      } else {
        Alert.alert("❌ Ошибка", data.error || "Ошибка загрузки");
      }
    } catch (err) {
      console.error("❌ Сеть/сервер:", err);
      Alert.alert("❌ Ошибка", "Не удалось загрузить");
    }
  };


  const renderPhotoBlock = (title: string, urls: string[]) => {
    if (!urls || urls.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView horizontal>
          {urls.map((url, idx) => (
            <Image
              key={idx}
              source={{ uri: API_URL + url }}
              style={styles.photo}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#000" />;
  if (!load) return <Text style={{ marginTop: 50, textAlign: "center" }}>Load not found</Text>;

  const normalizedStatus = (load.status || "").trim().toLowerCase();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Load #{load.load_id}</Text>

      <Text style={styles.text}>💲 Price: ${load.price} | RPM: {load.RPM}</Text>
      <Text style={styles.text}>📦 Weight: {load.weight} lbs</Text>
      <Text style={styles.text}>🛣 Miles: {load.total_miles}</Text>
      <Text style={styles.text}>📋 Status: {load.status}</Text>
      <Text style={styles.text}>💰 Payment: {load.payment_status}</Text>
      <Text style={styles.text}>📞 Broker: {load.broker_name} — {load.broker_phone}</Text>

      {renderLocation("Pickup", load.pickup)}
      {load.extra_pickup?.map((p: any, idx: number) => renderLocation(`Extra Pickup ${idx + 1}`, p))}
      {renderLocation("Delivery", load.delivery)}
      {load.extra_delivery?.map((d: any, idx: number) => renderLocation(`Extra Delivery ${idx + 1}`, d))}

      {renderPhotoBlock("📸 Фото с пикапа", load.pickup_photo_urls)}
      {renderPhotoBlock("📸 Фото на деливери", load.delivery_photo_urls)}

      {normalizedStatus === "new" && (
        <View style={styles.uploadBtn}>
          <Button title={uploading ? "Загрузка..." : "📤 Добавить фото с пикапа"} onPress={() => pickAndUploadPhotos("pickup")} disabled={uploading} />
        </View>
      )}
      {normalizedStatus === "picked_up" && (
        <View style={styles.uploadBtn}>
          <Button title={uploading ? "Загрузка..." : "📤 Добавить фото на деливери"} onPress={() => pickAndUploadPhotos("delivery")} disabled={uploading} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: "#f2f4f8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
  uploadBtn: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  photo: {
    width: 120,
    height: 120,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});
