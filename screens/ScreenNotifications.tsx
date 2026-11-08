import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function ScreenNotifications({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const alerts = [
    {
      title: "Límite excedido: Compras",
      desc: "Llevas $158.000 de $130.000 (118%).",
      color: "#C62828",
    },
    {
      title: "Alerta: Transporte al 93%",
      desc: "Llevas $74.000 de $80.000.",
      color: "#F9A825",
    },
    {
      title: "Gasto fijo próximo",
      desc: "Arriendo se cargará el 1 de septiembre.",
      color: "#3F51B5",
    },
  ];

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-[20px] font-bold mb-[16px]">Notificaciones</Text>
        <View className="gap-[10px]">
          {alerts.map((a, i) => (
            <View
              key={i}
              className="bg-card rounded-[14px] p-[14px]"
              style={{ borderLeftWidth: 4, borderLeftColor: a.color }}
            >
              <Text className="text-[14px] font-semibold mb-[4px]">
                {a.title}
              </Text>
              <Text className="text-[12px] text-text-secondary">{a.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active={6} onNav={onNav} />
    </View>
  );
}
