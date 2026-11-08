import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function ScreenOnboarding({
  onRegister,
  onLogin,
}: {
  onRegister: () => void;
  onLogin: () => void;
}) {
  const handleGoogleLogin = () => {
    Alert.alert(
      "Inicio con Google",
      "Próximamente disponible. Por ahora regístrate usando tu correo electrónico.",
    );
  };

  return (
    <LinearGradient
      colors={["#1A1233", "#2D1B6E", "#3F51B5"]}
      style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
    >
      {/* Logo y Nombre */}
      <View className="flex-row items-center gap-[10px] mt-[20px]">
        <View
          className="w-[42px] h-[42px] rounded-[12px] items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          <Feather name="credit-card" size={22} color="#fff" />
        </View>
        <Text className="text-card text-[22px] font-bold">FinZen</Text>
      </View>

      {/* Ilustración y Textos centrales */}
      <View className="items-center">
        <View className="w-[170px] h-[170px] rounded-[85px] border-[10px] border-accent items-center justify-center mb-[28px]">
          <Text className="text-card text-[32px] font-bold">68%</Text>
          <Text
            className="text-[12px]"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            presupuesto
          </Text>
        </View>
        <Text className="text-card text-[26px] font-bold text-center mb-[8px]">
          Tu dinero, bajo control
        </Text>
        <Text
          className="text-[14px] text-center leading-[20px]"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Visualiza gastos, evita deudas y alcanza tus metas de ahorro
          fácilmente.
        </Text>
      </View>

      {/* Botones inferiores */}
      <View className="gap-[12px] mb-[20px]">
        {/* Botón Crear Cuenta */}
        <TouchableOpacity
          onPress={onRegister}
          className="h-[50px] rounded-[14px] bg-accent items-center justify-center"
        >
          <Text className="text-card text-[15px] font-semibold">
            Crear cuenta con correo
          </Text>
        </TouchableOpacity>

        {/* Enlace Iniciar Sesión */}
        <TouchableOpacity
          onPress={onLogin}
          className="py-[8px] items-center justify-center"
        >
          <Text
            className="text-[14px]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            ¿Ya tienes cuenta?{" "}
            <Text className="text-card font-bold">Inicia sesión</Text>
          </Text>
        </TouchableOpacity>

        {/* Botón Continuar con Google */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          className="h-[50px] rounded-[14px] border-[1px] items-center justify-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Text className="text-card text-[14px]">Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
