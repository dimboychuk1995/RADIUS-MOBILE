import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import { getUser, getToken } from "@/lib/auth"; // ⬅️ добавили getToken
import { API_URL } from "@/lib/config";

export default function LoadsScreen() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLoads = async (pageToLoad: number) => {
    try {
      setLoading(true);

      const token = await getToken(); // ⬅️ достаем токен
      const user = await getUser();
      const role = user?.role;

      const params = new URLSearchParams({ page: pageToLoad.toString() });
      if (role === "driver") {
        params.append("role", "driver");
      } else {
        params.append("role", "admin");
      }

      const res = await fetch(`${API_URL}/api/loads?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ⬅️ передаем токен
        },
      });

      const data = await res.json();

      if (data.success) {
        setLoads((prev) => [...prev, ...data.loads]);
        setHasMore(data.loads.length === 10);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: any) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/load-details/[load_id]",
          params: { load_id: item.load_id },
        })
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>Load #{item.load_id}</Text>
        <Text style={styles.text}>📦 Pickup: {item.pickup_address}</Text>
        <Text style={styles.text}>📅 {formatDate(item.pickup_date)}</Text>
        <Text style={styles.text}>🏁 Delivery: {item.delivery_address}</Text>
        <Text style={styles.text}>📅 {formatDate(item.delivery_date)}</Text>
        <Text style={styles.text}>💲 ${item.price} | RPM: {item.RPM}</Text>
      </View>
    </Pressable>
  );

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
