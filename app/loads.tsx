import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_URL = "http://10.0.0.29:5000"; // заменишь на свой

export default function LoadsScreen() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLoads = async (pageToLoad: number) => {
    try {
      setLoading(true);
      const role = await AsyncStorage.getItem("user_role");
      const user_id = await AsyncStorage.getItem("user_id");

      const params = new URLSearchParams({ page: pageToLoad.toString() });
      if (role === "driver") {
        params.append("role", "driver");
        if (user_id) params.append("user_id", user_id);
      } else {
        params.append("role", "admin");
      }

      const res = await fetch(`${API_URL}/api/loads?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLoads((prev) => [...prev, ...data.loads]);
        setHasMore(data.loads.length === 10); // если пришло меньше 10 — конец
        setPage((prev) => prev + 1);
      } else {
        console.warn("Ошибка загрузки:", data.error);
      }
    } catch (err) {
      console.error("Ошибка:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads(1);
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.title}>Load #{item.load_id}</Text>
      <Text style={styles.text}>📦 Pickup: {item.pickup_address}</Text>
      <Text style={styles.text}>📅 {formatDate(item.pickup_date)}</Text>
      <Text style={styles.text}>🏁 Delivery: {item.delivery_address}</Text>
      <Text style={styles.text}>📅 {formatDate(item.delivery_date)}</Text>
      <Text style={styles.text}>💲 ${item.price} | RPM: {item.RPM}</Text>
    </View>
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <FlatList
      data={loads}
      keyExtractor={(item, index) => item.load_id + index}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      onEndReached={() => {
        if (!loading && hasMore) fetchLoads(page);
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator size="large" color="#000" /> : null}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#f2f4f8",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
});
