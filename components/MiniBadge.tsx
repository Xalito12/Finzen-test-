import React from "react";
import { Text, View } from "react-native";

export default function MiniBadge({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  return (
    <View
      className="w-[60px] h-[60px] rounded-[30px] border-[5px] items-center justify-center"
      style={{ borderColor: color }}
    >
      <Text className="text-[13px] font-bold text-card">{percent}%</Text>
    </View>
  );
}
