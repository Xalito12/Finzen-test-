import { createBottomTabNavigator, type BottomTabNavigationProp, } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { createContext, useCallback, useContext } from "react";
import { Pressable, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import ScreenCategories from "../screens/ScreenCategories";
import ScreenDashboard from "../screens/ScreenDashboard";
import ScreenNotifications from "../screens/ScreenNotifications";
import ScreenProfile from "../screens/ScreenProfile";
import ScreenQuickExpense from "../screens/ScreenQuickExpense";
import ScreenRecurring from "../screens/ScreenRecurring";
import ScreenSavingsGoals from "../screens/ScreenSavingsGoals";
import { TutorialProvider } from "../tutorial/TutorialProvider";
import { rutasAnteriores, type RutasFinzen } from "./rutas";

// Crea el navegador de pestañas utilizando las rutas definidas en RutasFinzen.
const Tabs = createBottomTabNavigator<RutasFinzen>();

// Comparte la acción de salir con las pantallas del navegador.
const SalirContext = createContext<() => void>(() => {});

// Adaptador temporal para los callbacks de los formularios existentes.
// Convierte los destinos numéricos en nombres de rutas para navegar.
function useNavegar() {
  const navigation = useNavigation<BottomTabNavigationProp<RutasFinzen>>();
  const salir = useContext(SalirContext);

  return useCallback(
    (destino: number) => {
      // El destino 0 ejecuta la acción de salida y termina la función.
      if (destino === 0) {
        salir();
        return;
      }

      const ruta = rutasAnteriores[destino];

      // Navega únicamente cuando el número corresponde a una ruta existente.
      if (ruta) navigation.navigate(ruta);
    },
    [navigation, salir],
  );
}

// Componentes estables: cambiar de pestaña no crea un tipo de pantalla nuevo.

// Muestra Inicio y le entrega la función para navegar.
function Inicio() {
  return <ScreenDashboard onNav={useNavegar()} />;
}

// Muestra la administración de categorías y permite navegar desde ella.
function Categorias() {
  return <ScreenCategories onNav={useNavegar()} />;
}

// Muestra el formulario para registrar un gasto.
function Gasto() {
  return <ScreenQuickExpense onNav={useNavegar()} />;
}

// Muestra la administración de metas de ahorro.
function Metas() {
  return <ScreenSavingsGoals onNav={useNavegar()} />;
}

// Muestra el perfil y sus opciones.
function Perfil() {
  return <ScreenProfile onNav={useNavegar()} />;
}

// Crea un botón para regresar a la pantalla anterior.
// Si no hay una pantalla anterior, lleva al usuario a Inicio.
function Volver() {
  const navigation = useNavigation<BottomTabNavigationProp<RutasFinzen>>();

  return (
    <Pressable
      onPress={() =>
        navigation.canGoBack()
          ? navigation.goBack()
          : navigation.navigate("Inicio")
      }
      accessibilityRole="button"
      accessibilityLabel="Volver a la pantalla anterior"
      className="px-[20px] py-[12px] bg-bg"
    >
      <Text className="text-primary font-semibold">‹ Volver</Text>
    </Pressable>
  );
}

// Muestra las notificaciones junto con el botón para volver.
function Notificaciones() {
  const onNav = useNavegar();

  return (
    <View className="flex-1">
      <Volver />
      <ScreenNotifications onNav={onNav} />
    </View>
  );
}

// Muestra los gastos fijos junto con el botón para volver.
function GastosFijos() {
  const onNav = useNavegar();

  return (
    <View className="flex-1">
      <Volver />
      <ScreenRecurring onNav={onNav} />
    </View>
  );
}

// Organiza las pantallas principales de FinZen.
// Recibe el usuario para gestionar su tutorial y la acción que se ejecutará al salir.
export default function FinzenTabs({
  usuarioId,
  onSalir,
}: {
  usuarioId: string;
  onSalir: () => void;
}) {
  return (
    // Proporciona el estado y las acciones del tutorial a las pantallas.
    <TutorialProvider usuarioId={usuarioId}>
      {/* Comparte la acción de salida mediante el contexto. */}
      <SalirContext.Provider value={onSalir}>
        {/* Comienza en Inicio, conserva el historial y utiliza la barra personalizada. */}
        <Tabs.Navigator
          initialRouteName="Inicio"
          backBehavior="history"
          detachInactiveScreens
          tabBar={(props) => <BottomNav {...props} />}
          screenOptions={{
            // Oculta el encabezado propio del navegador de pestañas.
            headerShown: false,

            // Carga cada pantalla cuando se visita por primera vez.
            lazy: true,

            // Define el fondo de las pantallas.
            sceneStyle: { backgroundColor: "#F5F3FA" },
          }}
        >
          {/* Registra las pantallas principales de la aplicación. */}
          <Tabs.Screen name="Inicio" component={Inicio} />
          <Tabs.Screen name="Categorias" component={Categorias} />
          <Tabs.Screen name="Gasto" component={Gasto} />
          <Tabs.Screen name="Metas" component={Metas} />
          <Tabs.Screen name="Perfil" component={Perfil} />

          {/* Registra las pantallas accesibles desde otras secciones. */}
          <Tabs.Screen name="Notificaciones" component={Notificaciones} />
          <Tabs.Screen name="GastosFijos" component={GastosFijos} />
        </Tabs.Navigator>
      </SalirContext.Provider>
    </TutorialProvider>
  );
}
