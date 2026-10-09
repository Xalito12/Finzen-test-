import React from "react";
import { View } from "react-native";

export default function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={{ height: 8, backgroundColor: "#E8E4F0", borderRadius: 99, overflow: "hidden" }}>
      <View
        style={{
          // Math.min asegura que si el cálculo matemático supera el límite lógico, el ancho gráfico nunca exceda el 100% del contenedor.
          width: `${Math.min(percent, 100)}%`,
          backgroundColor: color,
          height: "100%",
          borderRadius: 99,
        }}
      />
    </View>
  );
}