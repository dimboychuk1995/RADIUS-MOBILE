// lib/guard.ts
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { getUser } from "./auth";

export function useAuthGuard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const user = await getUser();
      const isLoggedIn = !!user;
      setIsAuthenticated(isLoggedIn);

      // если НЕ залогинен и НЕ на странице логина → уводим на логин
      if (!isLoggedIn && pathname !== "/login") {
        router.replace("/login");
      }

      // если уже залогинен и попал на /login — уводим на dashboard
      if (isLoggedIn && pathname === "/login") {
        router.replace("/dashboard");
      }
    })();
  }, [pathname]);

  return isAuthenticated;
}
