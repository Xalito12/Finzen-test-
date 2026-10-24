import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function ScreenOnboarding({
  onRegister,
  onLogin,  
  onNext,
}: {
  onRegister: () => void;
  onLogin: () => void;
  onNext?: () => void;
}) {
  const handleGoogleLogin = () => {
    Alert.alert(
      "Inicio con Google",
      "Próximamente disponible. Por ahora regístrate usando tu correo electrónico."
    );
  };

  return (
    <LinearGradient
      colors={["#1A1233", "#2D1B6E", "#3F51B5"]}
      style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="credit-card" size={22} color="#fff" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>FinZen</Text>
      </View>

      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 10,
            borderColor: "#7E57C2",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "700" }}>68%</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>presupuesto</Text>
        </View>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
          Tu dinero, bajo control
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
          Visualiza gastos, evita deudas y alcanza tus metas de ahorro fácilmente.
        </Text>
      </View>

      <View style={{ gap: 10, marginBottom: 20 }}>
        {/* Redirige a la pantalla de registro de Supabase (caso 9) */}
        <TouchableOpacity
          onPress={onRegister}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: "#7E57C2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Crear cuenta con correo</Text>
        </TouchableOpacity>

        <View style={{ gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={onRegister}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: "#7E57C2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Crear cuenta con correo</Text>
        </TouchableOpacity>

        {/* Enlace a Iniciar Sesión */}
        <TouchableOpacity
          onPress={onLogin}
          style={{
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
            ¿Ya tienes cuenta? <Text style={{ color: "#fff", fontWeight: "700" }}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>

        {/* Botón de Google */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
          
          
        >

          <Text style={{ color: "#fff", fontSize: 14 }}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
  
} 