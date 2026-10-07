import { Stack } from "expo-router";
import "../global.css"; // Carga los estilos globales (Tailwind / NativeWind)

// Layout raíz que envuelve la navegación de la app
export default function Layout() {
  return (
    
    // <Stack> gestiona la navegación nativa por pila (pantalla sobre pantalla)
    // screenOptions={{ headerShown: false }} oculta la barra superior por defecto de Expo
    <Stack screenOptions={{ headerShown: false }}>
      {/* Declaración de rutas dinámicas registradas en la aplicación */}
      <Stack.Screen name="index" />
      <Stack.Screen name="detalle" />
    </Stack>
  );
}