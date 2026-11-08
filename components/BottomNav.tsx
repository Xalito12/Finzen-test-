// components/BottomNav.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomNavProps {
  active: number;
  onNav: (screenIndex: number) => void;
}

export default function BottomNav({ active, onNav }: BottomNavProps) {
  // Obtiene la distancia exacta que ocupan los botones virtuales o la barra gestual del teléfono
  const insets = useSafeAreaInsets();

  // Si insets.bottom es 0 (en algunos modelos Android con botones clásicos), damos un margen de respaldo de 12px
  const paddingInferior = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 12 : 16,
  );

  const tabs = [
    { id: 2, label: "Inicio", icon: "home" },
    { id: 3, label: "Categorías", icon: "grid" },
    { id: 4, label: "Gasto", isAdd: true }, // Botón central circular
    { id: 7, label: "Metas", icon: "target" },
    { id: 8, label: "Perfil", icon: "user" },
  ];

  return (
    <View
      className="absolute bottom-[0px] left-[0px] right-[0px] bg-card pt-[10px] px-[12px] border-t-[1px] border-t-[#F0EEF6] flex-row items-center justify-around"
      style={{
        paddingBottom: paddingInferior,
        elevation: 12, // Sombra en Android
        shadowColor: "#000", // Sombra en iOS
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      {tabs.map((tab) => {
        // Botón central flotante de agregar gasto
        if (tab.isAdd) {
          return (
            <TouchableOpacity
              key="btn-add"
              activeOpacity={0.85}
              onPress={() => onNav(4)}
              className="-top-[18px] h-[54px] rounded-[27px] bg-primary items-center justify-center"
              style={{
                // Se eleva ligeramente sobre la barra
                width: 54,
                elevation: 6,
                shadowColor: "#512DA8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
              }}
            >
              <Feather name="plus" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          );
        }

        const isActive = active === tab.id;
        const iconColor = isActive ? "#512DA8" : "#8A849C";
        const textColor = isActive ? "#512DA8" : "#8A849C";

        return (
          <TouchableOpacity
            key={tab.label}
            activeOpacity={0.7}
            onPress={() => onNav(tab.id)}
            className="items-center justify-center min-w-[50px]"
          >
            <Feather name={tab.icon as any} size={22} color={iconColor} />
            <Text
              className="text-[11px] mt-[3px]"
              style={{ color: textColor, fontWeight: isActive ? "700" : "500" }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
