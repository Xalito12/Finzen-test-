import React from "react";
import { ScrollView, Text, View } from "react-native";

// Muestra una lista de gastos fijos de ejemplo con su monto y día de pago.
// Recibe onNav, aunque esta pantalla no lo utiliza.
export default function ScreenRecurring({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Datos de ejemplo definidos directamente en el código.
  const recurring = [
    { name: "Arriendo", icon: "🏠", amount: 380000, day: 1 },
    { name: "Netflix", icon: "📺", amount: 8990, day: 15 },
    { name: "Spotify", icon: "🎵", amount: 5990, day: 15 },
    { name: "Internet", icon: "📶", amount: 24990, day: 10 },
  ];

  return (
    <View className="flex-1">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20 }}
      >
        <Text className="text-[20px] font-bold mb-[16px]">Gastos Fijos</Text>
        <View className="gap-[10px]">
          {/* Recorre los gastos y crea una tarjeta para cada uno. */}
          {recurring.map((r) => (
            <View
              key={r.name}
              className="bg-card rounded-[14px] p-[14px] flex-row items-center justify-between"
            >
              {/* Icono, nombre y día de pago del gasto. */}
              <View className="flex-row items-center gap-[10px]">
                <Text className="text-[22px]">{r.icon}</Text>
                <View>
                  <Text className="text-[14px] font-semibold">{r.name}</Text>
                  <Text className="text-[11px] text-text-secondary">
                    Día {r.day} de cada mes
                  </Text>
                </View>
              </View>

              {/* Monto presentado con el formato numérico de Chile. */}
              <Text className="text-[14px] font-bold">
                ${r.amount.toLocaleString("es-CL")}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
