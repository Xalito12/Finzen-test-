import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function BottomNav({ active, onNav }: { active: number; onNav: (i: number) => void }) {
  const items = [
    { icon: "home", label: "Inicio", screen: 2 },
    { icon: "grid", label: "Categorias", screen: 3 },
    { icon: "plus", label: "", screen: 4 },
    { icon: "target", label: "Metas", screen: 5 },
    { icon: "user", label: "Perfil", screen: 8 },
  ];

  return (
    <View
      style={{
        height: 68,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderColor: "#E8E4F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: 6,
      }}
    >
      {items.map((item, i) => {
        if (i === 2) {
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onNav(item.screen)}
              style={{
                top: -16,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#512DA8",
                alignItems: "center",
                justifyContent: "center",
                elevation: 4,
              }}
            >
              <Feather name="plus" size={26} color="#fff" />
            </TouchableOpacity>
          );
        }
        const isActive = active === item.screen;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onNav(item.screen)}
            style={{ alignItems: "center", paddingHorizontal: 12 }}
          >
            <Feather name={item.icon as any} size={20} color={isActive ? "#512DA8" : "#8A849C"} />
            <Text
              style={{
                fontSize: 10,
                marginTop: 3,
                color: isActive ? "#512DA8" : "#8A849C",
                fontWeight: isActive ? "600" : "400",
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}