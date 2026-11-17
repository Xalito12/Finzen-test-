import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pestanasVisibles } from "../navigation/rutas";

export default function BottomNav({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(
            insets.bottom,
            Platform.OS === "android" ? 12 : 16,
          ),
        },
      ]}
    >
      {pestanasVisibles.map((tab) => {
        const route = state.routes.find(
          (item) => item.name === tab.name,
        );

        if (!route) return null;

        const selected =
          state.routes[state.index].key === route.key;

        const isAdd = tab.name === "Gasto";
        const color = selected ? "#512DA8" : "#6B6580";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!selected && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.65}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              isAdd ? "Registrar gasto" : tab.label
            }
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              })
            }
            style={styles.tab}
          >
            {isAdd ? (
              <View style={styles.addButton}>
                <Feather
                  name="plus"
                  size={28}
                  color="#fff"
                />
              </View>
            ) : (
              <>
                <Feather
                  name={tab.icon}
                  size={22}
                  color={color}
                />

                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color,
                      fontWeight: selected ? "700" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E8E4F0",
    paddingHorizontal: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  tab: {
    width: "20%",
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#512DA8",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    width: "100%",
    marginTop: 3,
    fontSize: 11,
    textAlign: "center",
  },
});