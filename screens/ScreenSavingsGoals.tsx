import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import ProgressBar from "../components/ProgressBar";

export default function ScreenSavingsGoals({ onNav }: { onNav: (i: number) => void }) {
  const goals = [
    { name: "Vacaciones Patagonia", icon: "🏔️", saved: 220000, target: 400000, color: "#7E57C2", deadline: "Dic 2026" },
    { name: "Fondo de emergencia", icon: "🛡️", saved: 320000, target: 510000, color: "#2E7D32", deadline: "Mar 2027" },
    { name: "MacBook Pro", icon: "💻", saved: 85000, target: 900000, color: "#3F51B5", deadline: "Jun 2027" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Metas de ahorro</Text>
        <View style={{ gap: 12 }}>
          {goals.map((g) => {
            const p = Math.round((g.saved / g.target) * 100);
            return (
              <View key={g.name} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 24 }}>{g.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600" }}>{g.name}</Text>
                    <Text style={{ fontSize: 11, color: "#6B6580" }}>{g.deadline}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: g.color }}>{p}%</Text>
                </View>
                <ProgressBar percent={p} color={g.color} />
                <Text style={{ fontSize: 11, color: "#6B6580", marginTop: 8 }}>
                  ${g.saved.toLocaleString("es-CL")} de ${g.target.toLocaleString("es-CL")}
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