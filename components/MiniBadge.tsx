import React from "react";
import { Text, View } from "react-native";

// Importa las herramientas para dibujar el indicador circular.
import Svg, { Circle } from "react-native-svg";

// Define los datos que recibe el componente.
interface MiniBadgeProps {
  percent: number | null; // Porcentaje disponible o null si falta el dato.
  color: string;          // Color del aro y del porcentaje.
  status: string;         // Descripción del estado del presupuesto.
}

// Muestra un aro con el porcentaje del presupuesto disponible.
export default function MiniBadge({
  percent,
  color,
  status,
}: MiniBadgeProps) {
  // Tamaño total del indicador.
  const size = 80;

  // Grosor del borde del círculo.
  const strokeWidth = 7;

  // Calcula el radio considerando el grosor del borde.
  const radius = (size - strokeWidth) / 2;

  // Calcula la longitud completa del círculo.
  const circumference = 2 * Math.PI * radius;

  // Comprueba que el porcentaje sea un número finito.
  // Si falta o es inválido, utiliza null.
  const validPercent =
    percent !== null && Number.isFinite(percent) ? percent : null;

  // Limita el porcentaje usado para dibujar el aro entre 0 y 100.
  // Si falta el dato, el aro queda vacío.
  const progress =
    validPercent === null
      ? 0
      : Math.max(0, Math.min(100, validPercent));

  // Prepara el texto con hasta un decimal.
  // Muestra una raya cuando no hay un porcentaje válido.
  const percentageText =
    validPercent === null
      ? "—"
      : `${Number(validPercent.toFixed(1))}%`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        validPercent === null
          ? status
          : `${status}. ${percentageText} del presupuesto disponible.`
      }
      style={{
        width: size,
        height: size,
        // Evita que el indicador se comprima dentro de una fila.
        flexShrink: 0,
      }}
    >
      {/* Área donde se dibujan los círculos. */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        accessible={false}
      >
        {/* Aro de fondo que representa el círculo completo. */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
        />

        {/* Dibuja el progreso cuando el porcentaje es mayor que cero. */}
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

      {/* Coloca los textos centrados sobre el aro. */}
      <View
        pointerEvents="none"
        className="absolute items-center justify-center"
        style={{
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
        accessible={false}
      >
        {/* Muestra el porcentaje y reduce su tamaño si el texto es largo. */}
        <Text
          style={{
            color,
            fontSize: percentageText.length > 6 ? 13 : 17,
            fontWeight: "700",
          }}
        >
          {percentageText}
        </Text>

        {/* Etiqueta que explica qué representa el porcentaje. */}
        <Text className="text-card text-[9px]">
          disponible
        </Text>
      </View>
    </View>
  );
}
