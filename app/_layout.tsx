import { Stack } from "expo-router";
import "../global.css";

// Layout raíz que envuelve la navegación de la app
export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Declaración de rutas dinámicas registradas en la aplicación */}
      <Stack.Screen name="index" />
      <Stack.Screen name="detalle" />
    </Stack>
  );
}