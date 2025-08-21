import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { API_URL } from "@/lib/config";
import { getUser } from "@/lib/auth";

type StatementItem = {
  id: string;
  company?: string;
  driver_id?: string;
  driver_name?: string;
  truck_number?: string | null;
  week_range?: string;
  created_local?: string | null;
  approved?: boolean;
  confirmed?: boolean;
  monday_loads?: number;
  invoices_num?: number;
  inspections_num?: number;
  extra_stops_total?: number;
  miles?: number;
  scheme_type?: string;
  per_mile_rate?: number;
  commission?: number;
  salary: number;
};

export default function StatementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<StatementItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const user = await getUser();
      if (!user || user.role !== "driver" || !user.driver_id) {
        setItems([]);
        setLoading(false);
        setError("Доступно только для роли driver.");
        return;
      }

      const url = `${API_URL}/api/mobile/statements?driver_id=${encodeURIComponent(
        user.driver_id
      )}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${user.token || ""}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Не удалось получить стейтменты");
      }

      setItems(json.items || []);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderItem = ({ item }: { item: StatementItem }) => {
    const badgeStyleApproved = [
      styles.badge,
      { backgroundColor: item.approved ? "#e8f8f0" : "#fff4e6", borderColor: item.approved ? "#2ecc71" : "#f39c12" },
    ];
    const badgeTextApproved = [
      styles.badgeText,
      { color: item.approved ? "#2ecc71" : "#f39c12" },
    ];

    const badgeStyleConfirmed = [
      styles.badge,
      { backgroundColor: item.confirmed ? "#eef2ff" : "#fde8ec", borderColor: item.confirmed ? "#6366f1" : "#e11d48" },
    ];
    const badgeTextConfirmed = [
      styles.badgeText,
      { color: item.confirmed ? "#6366f1" : "#e11d48" },
    ];

    return (
      <TouchableOpacity activeOpacity={0.85} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.weekRange}>{item.week_range || "—"}</Text>
          <Text style={styles.salary}>${(item.salary ?? 0).toFixed(2)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Создано:</Text>
          <Text style={styles.value}>{item.created_local || "—"}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={badgeStyleApproved}><Text style={badgeTextApproved}>{item.approved ? "Approved" : "Pending"}</Text></View>
          <View style={badgeStyleConfirmed}><Text style={badgeTextConfirmed}>{item.confirmed ? "Confirmed" : "Not confirmed"}</Text></View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>Loads: {item.monday_loads ?? 0}</Text>
          <Text style={styles.stat}>Invoices: {item.invoices_num ?? 0}</Text>
          <Text style={styles.stat}>Inspections: {item.inspections_num ?? 0}</Text>
          <Text style={styles.stat}>Miles: {item.miles ?? 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: "#333" }}>Загрузка…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#e11d48", fontSize: 16, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={[styles.retryBtn, { marginTop: 16 }]}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Последние стейтменты</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: "#666" }}>Нет данных</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    paddingTop: 18,
    paddingBottom: 6,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eef0f4",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekRange: { fontSize: 16, fontWeight: "700", color: "#111827" },
  salary: { fontSize: 18, fontWeight: "800", color: "#16a34a" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  label: { color: "#6b7280", fontSize: 14 },
  value: { color: "#111827", fontSize: 14, fontWeight: "600" },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  stat: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
