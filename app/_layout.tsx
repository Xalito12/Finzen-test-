// Importa el navegador que organiza las pantallas en una pila.
import { Stack } from "expo-router";
// Proporciona información sobre las áreas seguras del dispositivo.
import { SafeAreaProvider } from "react-native-safe-area-context";
// Carga los estilos globales de la aplicación.
import "../global.css";

// Layout principal que configura la navegación y el encabezado.
export default function Layout() {
  return (
    <SafeAreaProvider>
      {/* Define las opciones compartidas por las pantallas de esta pila. */}
      <Stack
        screenOptions={{
          // Muestra el encabezado.
          headerShown: true,
          // Texto que aparece como título del encabezado.
          headerTitle: "FinZen",
          // Centra el título horizontalmente.
          headerTitleAlign: "center",
          headerStyle: {
            // Color de fondo del encabezado.
            backgroundColor: "#512DA8",
          },
          // Color del título y de los botones del encabezado.
          headerTintColor: "#fff",
          headerTitleStyle: {
            // Tamaño de la letra del título.
            fontSize: 18,
            // Muestra el título en negrita.
            fontWeight: "bold",
          },
          // Oculta la sombra del encabezado.
          headerShadowVisible: false,
          // Usa texto e iconos claros en la barra de estado del teléfono.
          statusBarStyle: "light",
        }}
      >
        {/* Registra la ruta de la pantalla principal. */}
        <Stack.Screen name="index" />
        {/* Registra la ruta de la pantalla de detalle. */}
        <Stack.Screen name="detalle" />
      </Stack>
    </SafeAreaProvider>
  );
}
