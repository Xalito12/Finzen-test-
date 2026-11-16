import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface MiniBadgeProps {
  percent: number | null;
  color: string;
  status: string;
}

export default function MiniBadge({ percent, color, status }: MiniBadgeProps) {
  const size = 80;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPercent =
    percent !== null && Number.isFinite(percent) ? percent : null;
  const progress =
    validPercent === null ? 0 : Math.max(0, Math.min(100, validPercent));
  const percentageText =
    validPercent === null ? "—" : `${Number(validPercent.toFixed(1))}%`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        validPercent === null
          ? status
          : `${status}. ${percentageText} del presupuesto disponible.`
      }
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        accessible={false}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
        />
        {progress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View
        pointerEvents="none"
        className="absolute items-center justify-center"
        style={{ top: 0, bottom: 0, left: 0, right: 0 }}
        accessible={false}
      >
        <Text
          style={{
            color,
            fontSize: percentageText.length > 6 ? 13 : 17,
            fontWeight: "700",
          }}
        >
          {percentageText}
        </Text>
        <Text className="text-card text-[9px]">disponible</Text>
      </View>
    </View>
  );
}
