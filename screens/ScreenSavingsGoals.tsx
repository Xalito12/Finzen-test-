import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import ProgressBar from "../components/ProgressBar";

export default function ScreenSavingsGoals({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const goals = [
    {
      name: "Vacaciones Patagonia",
      icon: "🏔️",
      saved: 220000,
      target: 400000,
      color: "#7E57C2",
      deadline: "Dic 2026",
    },
    {
      name: "Fondo de emergencia",
      icon: "🛡️",
      saved: 320000,
      target: 510000,
      color: "#2E7D32",
      deadline: "Mar 2027",
    },
    {
      name: "MacBook Pro",
      icon: "💻",
      saved: 85000,
      target: 900000,
      color: "#3F51B5",
      deadline: "Jun 2027",
    },
  ];

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-[20px] font-bold mb-[16px]">Metas de ahorro</Text>
        <View className="gap-[12px]">
          {goals.map((g) => {
            const p = Math.round((g.saved / g.target) * 100);
            return (
              <View key={g.name} className="bg-card rounded-[16px] p-[16px]">
                <View className="flex-row items-center gap-[10px] mb-[10px]">
                  <Text className="text-[24px]">{g.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold">{g.name}</Text>
                    <Text className="text-[11px] text-text-secondary">
                      {g.deadline}
                    </Text>
                  </View>
                  <Text
                    className="text-[13px] font-bold"
                    style={{ color: g.color }}
                  >
                    {p}%
                  </Text>
                </View>
                <ProgressBar percent={p} color={g.color} />
                <Text className="text-[11px] text-text-secondary mt-[8px]">
                  ${g.saved.toLocaleString("es-CL")} de $
                  {g.target.toLocaleString("es-CL")}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <BottomNav active={5} onNav={onNav} />
    </View>
  );
}
