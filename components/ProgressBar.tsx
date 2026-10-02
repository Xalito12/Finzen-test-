import React from "react";
import { View } from "react-native";

export default function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={{ height: 8, backgroundColor: "#E8E4F0", borderRadius: 99, overflow: "hidden" }}>
      <View
        style={{
          width: `${Math.min(percent, 100)}%`,
          backgroundColor: color,
          height: "100%",
          borderRadius: 99,
        }}
      />
    </View>
  );
}