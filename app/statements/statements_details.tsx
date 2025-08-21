import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { API_URL } from "@/lib/config";
import { getUser } from "@/lib/auth";

type AnyDict = Record<string, any>;

export default function StatementDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnyDict | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (!id) {
        throw new Error("Missing statement id");
      }
      const user = await getUser();
      if (!user || user.role !== "driver") {
        throw new Error("Доступно только для роли driver.");
      }

      const url = `${API_URL}/api/mobile/statements/details?id=${encodeURIComponent(
        String(id)
      )}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.token || ""}` },
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Не удалось получить детали стейтмента");
      }

      setData(json.statement || null);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: "#333" }}>Загрузка…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#e11d48", fontSize: 16, textAlign: "center" }}>{error || "Нет данных"}</Text>
        <TouchableOpacity onPress={load} style={[styles.retryBtn, { marginTop: 16 }]}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { marginTop: 8 }]}>
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const raw = (data.raw ?? {}) as AnyDict;
  const loads: AnyDict[] = Array.isArray(raw.loads) ? raw.loads : [];
  const expenses: AnyDict[] = Array.isArray(raw.expenses) ? raw.expenses : [];
  const inspections: AnyDict[] = Array.isArray(raw.inspections) ? raw.inspections : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Стейтмент</Text>
        <View style={{ width: 64 }} />
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <Row label="Компания" value={data.company} />
        <Row label="Водитель" value={data.driver_name} />
        <Row label="Трак" value={data.truck_number ?? "—"} />
        <Row label="Период" value={data.week_range} />
        <Row label="Схема" value={data.scheme_type} />
        <Row label="Per mile rate" value={fmtNum(data.per_mile_rate)} />
        <Row label="Зарплата" value={`$${fmtNum(data.salary)}`} highlight />
        <Row label="Комиссия" value={`$${fmtNum(data.commission)}`} />
        <Row label="Мили" value={fmtNum(data.miles)} />
        <Row label="Loads / Invoices / Inspections" value={`${nz(data.monday_loads)} / ${nz(data.invoices_num)} / ${nz(data.inspections_num)}`} />
        <Row label="Extra stops" value={nz(data.extra_stops_total)} />
        <Row label="Approved / Confirmed" value={`${boolTxt(data.approved)} / ${boolTxt(data.confirmed)}`} />
        <Row label="Создан / Обновлён" value={`${safeDate(data.created_at)} / ${safeDate(data.updated_at)}`} />
        <Row label="Week start / end (UTC)" value={`${safeDate(data.week_start_utc)} / ${safeDate(data.week_end_utc)}`} />
      </View>

      {/* Loads */}
      <SectionTitle title={`Loads (${loads.length})`} />
      {loads.length === 0 ? (
        <Empty text="Нет грузов" />
      ) : (
        loads.map((l, idx) => (
          <View key={String(l?._id?.["$oid"] || l?._id || idx)} style={styles.card}>
            <Row label="Load ID" value={String(l?.load_id ?? "—")} />
            <Row label="Price" value={`$${fmtNum(l?.price)}`} />
            <Row label="Extra stops" value={nz(l?.extra_stops)} />
            <Row label="Pickup" value={fmtStop(l?.pickup)} />
            <Row label="Delivery" value={fmtStop(l?.delivery)} />
          </View>
        ))
      )}

      {/* Expenses */}
      <SectionTitle title={`Expenses (${expenses.length})`} />
      {expenses.length === 0 ? (
        <Empty text="Нет расходов" />
      ) : (
        expenses.map((e, idx) => (
          <View key={String(e?._id?.["$oid"] || e?._id || idx)} style={styles.card}>
            <Row label="Amount" value={`$${fmtNum(e?.amount)}`} />
            <Row label="Category" value={String(e?.category ?? "—")} />
            <Row label="Date" value={safeDate(e?.date)} />
            <Row label="Note" value={String(e?.note ?? "")} />
          </View>
        ))
      )}

      {/* Inspections */}
      <SectionTitle title={`Inspections (${inspections.length})`} />
      {inspections.length === 0 ? (
        <Empty text="Нет инспекций" />
      ) : (
        inspections.map((i, idx) => (
          <View key={String(i?._id?.["$oid"] || i?._id || idx)} style={styles.card}>
            <Row label="Date" value={safeDate(i?.date)} />
            <Row label="Start–End" value={`${i?.start_time || "—"} – ${i?.end_time || "—"}`} />
            <Row label="Clean" value={boolTxt(i?.clean_inspection)} />
            <Row label="State" value={String(i?.state ?? "")} />
            <Row label="Address" value={String(i?.address ?? "")} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

/* ---------- helpers / small components ---------- */

function Row({ label, value, highlight }: { label: string; value?: string | number; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, highlight && { color: "#16a34a" }]}>{label}</Text>
      <Text style={[styles.value, highlight && { color: "#16a34a", fontWeight: "800" }]} numberOfLines={3}>
        {value !== undefined && value !== null && String(value).length ? String(value) : "—"}
      </Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function nz(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function fmtNum(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function boolTxt(v: any) {
  return v ? "Да" : "Нет";
}

function safeDate(v: any) {
  if (!v) return "—";
  try {
    // Поддержка ISO и Mongo-подобного { $date: ... }
    if (typeof v === "object" && v.$date) return new Date(v.$date).toISOString();
    return new Date(v).toISOString();
  } catch {
    return String(v);
  }
}

function fmtStop(stop: any) {
  if (!stop) return "—";
  const address = stop.address || "";
  const company = stop.company || "";
  const timeFrom = stop.time_from || "";
  const timeTo = stop.time_to || "";
  const date = stop.date ? safeDate(stop.date) : "";
  const core = [company, address].filter(Boolean).join(" • ");
  const window = [timeFrom, timeTo].filter(Boolean).join("–");
  return [core, date, window].filter(Boolean).join(" | ");
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", textAlign: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#eef2ff",
    borderRadius: 10,
  },
  backText: { color: "#4f46e5", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eef0f4",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 12,
  },
  label: { color: "#6b7280", fontSize: 14, flex: 1 },
  value: { color: "#111827", fontSize: 14, fontWeight: "600", flex: 1.2, textAlign: "right" },
  section: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  empty: { color: "#6b7280", textAlign: "center", marginBottom: 8 },
  retryBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
