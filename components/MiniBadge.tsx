import React from "react";
import { Text, View } from "react-native";

export default function MiniBadge({ percent, color }: { percent: number; color: string }) {
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{percent}%</Text>
    </View>
  );
}