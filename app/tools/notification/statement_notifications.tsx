// app/tools/notification/statement_notifications.tsx
// Приём push-уведомлений по СТЕЙТМЕНТАМ + обработка тапа/холодного старта под Expo SDK 53.
// Навигацию не шьём жёстко — отдаём идентификаторы через коллбэк onOpenStatement.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_URL } from "@/lib/config";
import { getUser } from "@/lib/auth";

type Unsubscribe = () => void;

const EXPO_PROJECT_ID = "1888630c-08e1-4ab5-8528-259646bbb501";

// Чтобы не дублировать регистрацию токена и слушателей при многократных вызовах
let _tokenRegisteredOnce = false;
let _listenersAttached = false;

// ---------- utils ----------
function extractStatementInfo(data: any): { statementId: string | null; weekRange: string | null } {
  if (!data || typeof data !== "object") return { statementId: null, weekRange: null };

  // Поддержим несколько ключей на всякий случай
  const idCandidates = [data.statement_id, data.statementId, data.id];
  let statementId: string | null = null;
  for (const v of idCandidates) {
    if (typeof v === "string" && v.trim()) {
      statementId = v;
      break;
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      statementId = String(v);
      break;
    }
  }

  const weekRange =
    typeof data.week_range === "string"
      ? data.week_range
      : typeof data.weekRange === "string"
      ? data.weekRange
      : null;

  return { statementId, weekRange };
}

/**
 * Регистрирует токен (один раз на процесс) и вешает слушатели по уведомлениям "statement".
 * @param onOpenStatement вызывается при тапе/холодном старте, если в payload есть type==="statement"
 *                        и/или присутствуют statement_id / week_range.
 *                        Сигнатура: (statementId: string | null, weekRange: string | null) => void
 */
export async function initStatementNotifications(
  onOpenStatement: (statementId: string | null, weekRange: string | null) => void
): Promise<Unsubscribe> {
  // 1) Регистрация токена (идемпотентно)
  if (!_tokenRegisteredOnce && Device.isDevice && Platform.OS !== "web") {
    try {
      const user = await getUser();
      if (user && user.role === "driver" && user.driver_id) {
        const perms = await Notifications.requestPermissionsAsync();
        if (perms.status === "granted") {
          const { data: expoToken } = await Notifications.getExpoPushTokenAsync({
            projectId: EXPO_PROJECT_ID,
          });

          await fetch(`${API_URL}/api/drivers/${user.driver_id}/update_push_token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token || ""}`,
            },
            body: JSON.stringify({ expo_push_token: expoToken }),
          });
          _tokenRegisteredOnce = true;
        } else {
          console.warn("❌ Push разрешение не выдано");
        }
      }
    } catch (e) {
      console.warn("❌ Ошибка при регистрации push токена (statements):", e);
    }
  }

  // 2) Канал для Android
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

  // 3) Слушатели — ставим один раз
  if (_listenersAttached) {
    return () => {};
  }
  _listenersAttached = true;

  const receivedSub = Notifications.addNotificationReceivedListener((_n) => {
    // сюда можно добавить in-app тост/баннер при доставке в фореграунде
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response?.notification?.request?.content?.data ?? {};
      if (data?.type === "statement") {
        const { statementId, weekRange } = extractStatementInfo(data);
        onOpenStatement(statementId, weekRange);
      }
    } catch {
      // ignore
    }
  });

  // 4) Холодный старт (приложение открыто нажатием на пуш)
  (async () => {
    try {
      const initial = await Notifications.getLastNotificationResponseAsync();
      const data = initial?.notification?.request?.content?.data ?? null;
      if (data?.type === "statement") {
        const { statementId, weekRange } = extractStatementInfo(data);
        onOpenStatement(statementId, weekRange);
      }
    } catch {
      // ignore
    }
  })();

  // 5) Отписка
  return () => {
    try {
      if (receivedSub) Notifications.removeNotificationSubscription(receivedSub);
      if (responseSub) Notifications.removeNotificationSubscription(responseSub);
    } catch {
      // ignore
    } finally {
      _listenersAttached = false;
    }
  };
}
