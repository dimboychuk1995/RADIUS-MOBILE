// app/tools/notification/load_notifications.tsx
// Регистрация Expo push-токена ВОДИТЕЛЯ + приём уведомлений о грузах (loads)
// + обработка тапа и холодного старта под Expo SDK 53.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_URL } from "@/lib/config";
import { getUser } from "@/lib/auth";

type Unsubscribe = () => void;

const EXPO_PROJECT_ID = "1888630c-08e1-4ab5-8528-259646bbb501";

// ---------- utils ----------
function extractLoadId(data: any): string | null {
  if (!data || typeof data !== "object") return null;
  const candidates = [data.load_id, data.loadId, data.load, data.id];
  for (const v of candidates) {
    if (typeof v === "string" && v.trim().length > 0) return v;
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return null;
}

// ---------- foreground behavior (SDK 53) ----------
Notifications.setNotificationHandler({
  // не указываем явный тип, а ветки приводим к NotificationBehavior
  handleNotification: async () => {
    if (Platform.OS === "ios") {
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
      } as Notifications.NotificationBehavior;
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as Notifications.NotificationBehavior;
  },
});

// ---------- public API ----------
/**
 * Регистрирует токен для текущего водителя (если роль driver) и вешает слушатели пушей.
 * @param onOpenLoad коллбэк — что делаем при тапе (и холодном старте) с load_id
 * @returns функция отписки от слушателей
 */
export async function initLoadNotifications(
  onOpenLoad: (loadId: string) => void
): Promise<Unsubscribe> {
  // 1) регистрация токена (только реальные устройства, не web)
  if (Device.isDevice && Platform.OS !== "web") {
    try {
      const user = await getUser();
      if (user && user.role === "driver" && user.driver_id) {
        // Разрешения
        const perms = await Notifications.requestPermissionsAsync();
        if (perms.status === "granted") {
          // Получить Expo push token
          const { data: expoToken } = await Notifications.getExpoPushTokenAsync({
            projectId: EXPO_PROJECT_ID,
          });

          // Отправить на бэкенд
          const url = `${API_URL}/api/drivers/${user.driver_id}/update_push_token`;
          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token || ""}`,
            },
            body: JSON.stringify({ expo_push_token: expoToken }),
          });
        } else {
          console.warn("❌ Push разрешение не выдано");
        }
      }
    } catch (e) {
      console.warn("❌ Ошибка при регистрации push токена:", e);
    }
  }

  // 2) канал для Android
  (async () => {
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
        });
      } catch {
        // ignore
      }
    }
  })();

  // 3) слушатели
  const receivedSub = Notifications.addNotificationReceivedListener((_n) => {
    // сюда можно добавить in-app toast
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response?.notification?.request?.content?.data ?? {};
      const loadId = extractLoadId(data);
      if (loadId) onOpenLoad(loadId);
    } catch {
      // ignore
    }
  });

  // 4) холодный старт (если приложение открыли тапом по пушу)
  (async () => {
    try {
      const initial = await Notifications.getLastNotificationResponseAsync();
      const data = initial?.notification?.request?.content?.data ?? null;
      const loadId = extractLoadId(data);
      if (loadId) onOpenLoad(loadId);
    } catch {
      // ignore
    }
  })();

  // 5) отписка
  return () => {
    try {
      if (receivedSub) Notifications.removeNotificationSubscription(receivedSub);
      if (responseSub) Notifications.removeNotificationSubscription(responseSub);
    } catch {
      // ignore
    }
  };
}
