import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { getUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";

type ExpenseItem = {
  _id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  photo_url: string;
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = async () => {
    try {
      const user = await getUser();
      if (!user?.token) throw new Error("Нет токена");

      const res = await fetch(`${API_URL}/api/driver/expenses`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.warn("Ошибка загрузки чеков:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const renderItem = ({ item }: { item: ExpenseItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: `${API_URL}${item.photo_url}` }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.note}>{item.note}</Text>
        <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString("en-US")}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/expenses/add")}>
        <Text style={styles.addButtonText}>➕ Добавить чек</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchExpenses();
            }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  category: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  note: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
});
