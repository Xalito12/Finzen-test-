import { Stack } from "expo-router";
import "../global.css";

// Layout raíz que envuelve la navegación de la app
export default function Layout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerTitle: "FinZen",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: "#512DA8" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontSize: 18, fontWeight: "bold" },
      headerShadowVisible: false,
      statusBarStyle: "light",
    }}>
      {/* Declaración de rutas dinámicas registradas en la aplicación */}
      <Stack.Screen name="index" />
      <Stack.Screen name="detalle" />
    </Stack>
  );
}