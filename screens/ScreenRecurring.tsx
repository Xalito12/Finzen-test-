import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function ScreenRecurring({ onNav }: { onNav: (i: number) => void }) {
  const recurring = [
    { name: "Arriendo", icon: "🏠", amount: 380000, day: 1 },
    { name: "Netflix", icon: "📺", amount: 8990, day: 15 },
    { name: "Spotify", icon: "🎵", amount: 5990, day: 15 },
    { name: "Internet", icon: "📶", amount: 24990, day: 10 },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Gastos Fijos</Text>
        <View style={{ gap: 10 }}>
          {recurring.map((r) => (
            <View key={r.name} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>{r.name}</Text>
                  <Text style={{ fontSize: 11, color: "#6B6580" }}>Día {r.day} de cada mes</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700" }}>${r.amount.toLocaleString("es-CL")}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active={7} onNav={onNav} />
    </View>
  );
}