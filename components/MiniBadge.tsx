import React from "react";
import { Text, View } from "react-native";

export default function MiniBadge({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, percent) : 0;
  const progress = Math.min(safePercent, 100);
  const progressColor =
    safePercent >= 100 ? "#FF8A80" : safePercent >= 80 ? "#FFD54F" : "#A5F3AE";
  const segmentCount = 120;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Porcentaje del sueldo gastado: ${safePercent}%`}
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      className="w-[60px] h-[60px] items-center justify-center"
    >
      <View
        style={{
          position: "absolute",
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: 5,
          borderColor: color,
          opacity: 0.22,
        }}
      />
      {/* Overlapping dots draw a continuous arc using native views on every platform. */}
      {Array.from({ length: Math.round((progress / 100) * segmentCount) }, (_, i) => {
        const angle = (i / segmentCount) * Math.PI * 2 - Math.PI / 2;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              borderRadius: 2.5,
              left: 27.5 + 27.5 * Math.cos(angle),
              top: 27.5 + 27.5 * Math.sin(angle),
              backgroundColor: progressColor,
            }}
          />
        );
      })}
      <Text className="text-[13px] font-bold text-card">{safePercent}%</Text>
    </View>
  );
}
