import React, { useState } from "react";
import { SafeAreaView, StatusBar } from "react-native";

import ScreenCategories from "../screens/ScreenCategories";
import ScreenDashboard from "../screens/ScreenDashboard";
import ScreenNotifications from "../screens/ScreenNotifications";
import ScreenOnboarding from "../screens/ScreenOnboarding";
import ScreenProfile from "../screens/ScreenProfile";
import ScreenQuickExpense from "../screens/ScreenQuickExpense";
import ScreenRecurring from "../screens/ScreenRecurring";
import ScreenSalarySetup from "../screens/ScreenSalarySetup";
import ScreenSavingsGoals from "../screens/ScreenSavingsGoals";
// Importación modular de subpantallas...

export default function App() {
  // Estado numérico que actúa como máquina de estados para la navegación
  const [screen, setScreen] = useState(2); // Inicia por defecto en ScreenDashboard (2)

  // Condicional de renderizado según el valor del estado 'screen'
  const renderScreen = () => {
    switch (screen) {
      case 0:
        return <ScreenOnboarding onNext={() => setScreen(1)} />;
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
      default:
        return <ScreenDashboard onNav={setScreen} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()} {/* Monta la pantalla seleccionada dinámicamente */}
    </SafeAreaView>
  );
}