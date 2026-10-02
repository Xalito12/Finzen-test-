import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function ScreenNotifications({ onNav }: { onNav: (i: number) => void }) {
  const alerts = [
    { title: "Límite excedido: Compras", desc: "Llevas $158.000 de $130.000 (118%).", color: "#C62828" },
    { title: "Alerta: Transporte al 93%", desc: "Llevas $74.000 de $80.000.", color: "#F9A825" },
    { title: "Gasto fijo próximo", desc: "Arriendo se cargará el 1 de septiembre.", color: "#3F51B5" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Notificaciones</Text>
        <View style={{ gap: 10 }}>
          {alerts.map((a, i) => (
            <View key={i} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: a.color }}>
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 4 }}>{a.title}</Text>
              <Text style={{ fontSize: 12, color: "#6B6580" }}>{a.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active={6} onNav={onNav} />
    </View>
  );
}