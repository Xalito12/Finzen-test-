import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: "FinZen",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#512DA8",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "bold",
          },
          headerShadowVisible: false,
          statusBarStyle: "light",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="detalle" />
      </Stack>
    </SafeAreaProvider>
  );
}