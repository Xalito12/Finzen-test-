import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pestanasVisibles } from "../navigation/rutas";

// Una sola barra, medida por el navegador y fuera del contenido desplazable.
export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      className="bg-card flex-row items-center justify-around border-t-[1px] border-border px-[8px] pt-[10px]"
      style={{
        paddingBottom: Math.max(
          insets.bottom,
          Platform.OS === "android" ? 12 : 16,
        ),
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      {pestanasVisibles.map((tab) => {
        const route = state.routes.find((item) => item.name === tab.name);
        if (!route) return null;
        const selected = state.routes[state.index].key === route.key;
        const isAdd = tab.name === "Gasto";
        const color = isAdd ? "#fff" : selected ? "#512DA8" : "#6B6580";
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!selected && !event.defaultPrevented)
            navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={isAdd ? "Registrar gasto" : tab.label}
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            hitSlop={4}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 54,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            {isAdd ? (
              <View
                className="bg-primary rounded-[27px] w-[54px] h-[54px] items-center justify-center"
                style={{ marginTop: -18 }}
              >
                <Feather name="plus" size={28} color={color} />
              </View>
            ) : (
              <>
                <Feather name={tab.icon} size={22} color={color} />
                <Text
                  className="text-[11px] mt-[3px]"
                  style={{ color, fontWeight: selected ? "700" : "500" }}
                >
                  {tab.label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
