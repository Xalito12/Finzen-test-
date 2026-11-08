import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function ScreenRecurring({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const recurring = [
    { name: "Arriendo", icon: "🏠", amount: 380000, day: 1 },
    { name: "Netflix", icon: "📺", amount: 8990, day: 15 },
    { name: "Spotify", icon: "🎵", amount: 5990, day: 15 },
    { name: "Internet", icon: "📶", amount: 24990, day: 10 },
  ];

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-[20px] font-bold mb-[16px]">Gastos Fijos</Text>
        <View className="gap-[10px]">
          {recurring.map((r) => (
            <View
              key={r.name}
              className="bg-card rounded-[14px] p-[14px] flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-[10px]">
                <Text className="text-[22px]">{r.icon}</Text>
                <View>
                  <Text className="text-[14px] font-semibold">{r.name}</Text>
                  <Text className="text-[11px] text-text-secondary">
                    Día {r.day} de cada mes
                  </Text>
                </View>
              </View>
              <Text className="text-[14px] font-bold">
                ${r.amount.toLocaleString("es-CL")}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active={7} onNav={onNav} />
    </View>
  );
}
