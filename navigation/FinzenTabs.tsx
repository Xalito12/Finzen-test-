import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
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

const Tabs = createBottomTabNavigator<RutasFinzen>();
const SalirContext = createContext<() => void>(() => {});

// Adaptador temporal para los callbacks de los formularios existentes.
function useNavegar() {
  const navigation = useNavigation<BottomTabNavigationProp<RutasFinzen>>();
  const salir = useContext(SalirContext);
  return useCallback(
    (destino: number) => {
      if (destino === 0) {
        salir();
        return;
      }
      const ruta = rutasAnteriores[destino];
      if (ruta) navigation.navigate(ruta);
    },
    [navigation, salir],
  );
}

// Componentes estables: cambiar de pestaña no crea un tipo de pantalla nuevo.
function Inicio() {
  return <ScreenDashboard onNav={useNavegar()} />;
}
function Categorias() {
  return <ScreenCategories onNav={useNavegar()} />;
}
function Gasto() {
  return <ScreenQuickExpense onNav={useNavegar()} />;
}
function Metas() {
  return <ScreenSavingsGoals onNav={useNavegar()} />;
}
function Perfil() {
  return <ScreenProfile onNav={useNavegar()} />;
}

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
function Notificaciones() {
  const onNav = useNavegar();
  return (
    <View className="flex-1">
      <Volver />
      <ScreenNotifications onNav={onNav} />
    </View>
  );
}
function GastosFijos() {
  const onNav = useNavegar();
  return (
    <View className="flex-1">
      <Volver />
      <ScreenRecurring onNav={onNav} />
    </View>
  );
}

export default function FinzenTabs({
  usuarioId,
  onSalir,
}: {
  usuarioId: string;
  onSalir: () => void;
}) {
  return (
    <TutorialProvider usuarioId={usuarioId}>
      <SalirContext.Provider value={onSalir}>
        <Tabs.Navigator
          initialRouteName="Inicio"
          backBehavior="history"
          detachInactiveScreens
          tabBar={(props) => <BottomNav {...props} />}
          screenOptions={{
            headerShown: false,
            lazy: true,
            sceneStyle: { backgroundColor: "#F5F3FA" },
          }}
        >
          <Tabs.Screen name="Inicio" component={Inicio} />
          <Tabs.Screen name="Categorias" component={Categorias} />
          <Tabs.Screen name="Gasto" component={Gasto} />
          <Tabs.Screen name="Metas" component={Metas} />
          <Tabs.Screen name="Perfil" component={Perfil} />
          <Tabs.Screen name="Notificaciones" component={Notificaciones} />
          <Tabs.Screen name="GastosFijos" component={GastosFijos} />
        </Tabs.Navigator>
      </SalirContext.Provider>
    </TutorialProvider>
  );
}
