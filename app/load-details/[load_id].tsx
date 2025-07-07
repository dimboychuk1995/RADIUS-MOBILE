import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { API_URL } from "@/lib/config";

export default function LoadDetailsScreen() {
  const { load_id } = useLocalSearchParams();
  const [load, setLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!load_id) return;

    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/load/${load_id}`);
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

    fetchDetails();
  }, [load_id]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#000" />;
  }

  if (!load) {
    return <Text style={{ marginTop: 50, textAlign: "center" }}>Load not found</Text>;
  }

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

      {load.extra_pickup?.length > 0 &&
        load.extra_pickup.map((p: any, idx: number) => renderLocation(`Extra Pickup ${idx + 1}`, p))}

      {renderLocation("Delivery", load.delivery)}

      {load.extra_delivery?.length > 0 &&
        load.extra_delivery.map((d: any, idx: number) => renderLocation(`Extra Delivery ${idx + 1}`, d))}
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
});
