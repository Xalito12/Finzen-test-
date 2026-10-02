import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ScreenOnboarding({ onNext }: { onNext: () => void }) {
  return (
    <LinearGradient colors={["#1A1233", "#2D1B6E", "#3F51B5"]} style={{ flex: 1, padding: 24, justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
          <Feather name="credit-card" size={22} color="#fff" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>FinZen</Text>
      </View>

      <View style={{ alignItems: "center" }}>
        <View style={{ width: 170, height: 170, borderRadius: 85, borderWidth: 10, borderColor: "#7E57C2", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
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
        <TouchableOpacity onPress={onNext} style={{ height: 50, borderRadius: 14, backgroundColor: "#7E57C2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Crear cuenta con correo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ height: 50, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 14 }}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}