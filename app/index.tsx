import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, View } from "react-native";
import { supabase } from "../database/supabase"; // Importa tu cliente de Supabase

import ScreenCategories from "../screens/ScreenCategories";
import ScreenDashboard from "../screens/ScreenDashboard";
import ScreenLogin from "../screens/ScreenLogin"; // Arriba con los demás imports
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
  // 1. Al abrir la app por primera vez:
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session?.user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("sueldo")
      .eq("id", session.user.id)
      .single();

    if (perfil && perfil.sueldo > 0) {
      setScreen(2); // Sueldo ya definido -> Dashboard
    } else {
      setScreen(1); // Sueldo pendiente -> Configurar sueldo
    }
  } else {
    setScreen(0); // Sin sesión -> Onboarding
  }
});

  // 2. Escucha si el usuario cierra sesión (logout)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      setScreen(0);
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
            onRegister={() => setScreen(9)}
            onLogin={() => setScreen(10)}
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
        case 10:
        return <ScreenLogin onNav={setScreen} />;
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