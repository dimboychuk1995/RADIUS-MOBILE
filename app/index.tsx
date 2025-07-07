// app/index.tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, Text } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View>
      <Text>Redirecting...</Text>
    </View>
  );
}
