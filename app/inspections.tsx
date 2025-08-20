// app/inspections/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { getUser, getToken } from "@/lib/auth";
import { API_URL } from "@/lib/config";

export default function InspectionsScreen() {
  const router = useRouter();

  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchInspections = async (pageToLoad: number) => {
    try {
      setLoading(true);
      const token = await getToken();
      await getUser(); // зарезервировано под возможную роль/контекст

      const params = new URLSearchParams({ page: pageToLoad.toString() });
      const res = await fetch(`${API_URL}/api/mobile/inspections?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        const pageItems = Array.isArray(data.items) ? data.items : [];
        setInspections((prev) => [...prev, ...pageItems]);
        setHasMore(pageItems.length === 10 || data.has_more === true);
        setPage((prev) => prev + 1);
      } else {
        console.warn("Load inspections error:", data.error);
      }
    } catch (err) {
      console.error("Load inspections error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections(1);
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{item.date || "—"}</Text>
        <Text
          style={[
            styles.badge,
            item.clean_inspection ? styles.badgeGreen : styles.badgeRed,
          ]}
        >
          {item.clean_inspection
            ? "CLEAN"
            : `${(item.violations?.length ?? 0)} violations`}
        </Text>
      </View>
      {!!item.state && <Text style={styles.text}>State: {item.state}</Text>}
      {!!item.address && <Text style={styles.text}>{item.address}</Text>}
      <View style={styles.row}>
        <Text style={styles.meta}>Start: {item.start_time || "—"}</Text>
        <Text style={styles.meta}>End: {item.end_time || "—"}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Кнопка добавления — как раньше */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/inspections/add_inspection")}
      >
        <Text style={styles.addButtonText}>➕ Add DOT Inspection</Text>
      </TouchableOpacity>

      <FlatList
        data={inspections}
        keyExtractor={(item, index) => (item.id || index).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (!loading && hasMore) fetchInspections(page);
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" color="#000" /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No inspections</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // те же стили контейнера и кнопки, что у тебя были
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

  // список
  list: { paddingBottom: 24 },
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { fontSize: 16, fontWeight: "700", color: "#0c1a2a" },
  text: { fontSize: 14, marginTop: 6 },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 8 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0c1a2a", marginBottom: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    color: "#0c1a2a",
    overflow: "hidden",
  },
  badgeGreen: { backgroundColor: "#16a34a1a", borderWidth: 1, borderColor: "#16a34a" },
  badgeRed: { backgroundColor: "#ef44441a", borderWidth: 1, borderColor: "#ef4444" },
});
