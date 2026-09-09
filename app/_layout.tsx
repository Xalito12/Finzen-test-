import "../global.css";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#512DA8" }, // Color Primario
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Mis elementos" }} />
      <Stack.Screen name="detalle" options={{ title: "Detalle del Elemento" }} />
    </Stack>
  );
}