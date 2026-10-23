import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, View } from "react-native";
import { supabase } from "../database/supabase"; // Importa tu cliente de Supabase

import ScreenCategories from "../screens/ScreenCategories";
import ScreenDashboard from "../screens/ScreenDashboard";
import ScreenNotifications from "../screens/ScreenNotifications";
import ScreenOnboarding from "../screens/ScreenOnboarding";
import ScreenProfile from "../screens/ScreenProfile";
import ScreenQuickExpense from "../screens/ScreenQuickExpense";
import ScreenRecurring from "../screens/ScreenRecurring";
import ScreenRegister from "../screens/ScreenRegister";
import ScreenSalarySetup from "../screens/ScreenSalarySetup";
import ScreenSavingsGoals from "../screens/ScreenSavingsGoals";

export default function App() {
  const [screen, setScreen] = useState<number | null>(null); // Inicia en null mientras revisa la sesión

  useEffect(() => {
    // 1. Revisa si hay un usuario logueado en la sesión guardada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setScreen(2); // Usuario autenticado -> va al Dashboard
      } else {
        setScreen(9); // Sin cuenta o deslogueado -> va al Registro
      }
    });

    // 2. Escucha cambios de sesión en tiempo real (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setScreen(2);
      } else {
        setScreen(9);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 0:
  return (
    <ScreenOnboarding
      onRegister={() => setScreen(9)} // Lleva al formulario de registro
      onNext={() => setScreen(1)}     // Lleva a configurar sueldo
    />
  );
      case 1:
        return <ScreenSalarySetup onNext={() => setScreen(2)} />;
      case 2:
        return <ScreenDashboard onNav={setScreen} />;
      case 3:
        return <ScreenCategories onNav={setScreen} />;
      case 4:
        return <ScreenQuickExpense onNav={setScreen} />;
      case 5:
        return <ScreenSavingsGoals onNav={setScreen} />;
      case 6:
        return <ScreenNotifications onNav={setScreen} />;
      case 7:
        return <ScreenRecurring onNav={setScreen} />;
      case 8:
        return <ScreenProfile onNav={setScreen} />;
      case 9:
        return <ScreenRegister onNav={setScreen} />;
      default:
        return <ScreenDashboard onNav={setScreen} />;
    }
  };

  // Muestra un loader rápido mientras Supabase comprueba el almacenamiento local
  if (screen === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F3FA", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#512DA8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </SafeAreaView>
  );
}