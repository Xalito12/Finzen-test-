import React from "react";
import { View } from "react-native";

export default function ProgressBar({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  return (
    <View className="h-[8px] bg-border rounded-[99px] overflow-hidden">
      <View
        className="h-full rounded-[99px]"
        style={{
          width: `${Math.min(percent, 100)}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
