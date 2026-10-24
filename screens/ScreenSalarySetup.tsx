import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../database/supabase";

export default function ScreenSalarySetup({ onNext }: { onNext: () => void }) {
  const [sueldo, setSueldo] = useState("850000");
  const [diaPago, setDiaPago] = useState(1);

  const dias = [1, 5, 7, 10, 14, 15, 28, 30];

const handleGuardarConfiguracion = async () => {
  const montoLimpio = parseInt(sueldo.replace(/[^0-9]/g, ""));

  if (isNaN(montoLimpio) || montoLimpio <= 0) {
    Alert.alert("Atención", "Por favor ingresa un sueldo válido.");
    return;
  }

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Alert.alert("Error", "Sesión no encontrada.");
    return;
  }

  // Actualizar en Supabase
  const { error } = await supabase
    .from("perfiles")
    .update({
      sueldo: montoLimpio,
      dia_pago: diaPago,
    })
    .eq("id", user.id);

  if (error) {
    Alert.alert("Error al guardar", error.message);
    return;
  }

  onNext(); // Lleva al Dashboard (pantalla 2)
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F5F3FA" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "space-between" }}>
        <View>
          {/* Encabezado con Icono */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#E8E4F0",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              marginTop: 10,
            }}
          >
            <Feather name="credit-card" size={22} color="#512DA8" />
          </View>

          <Text style={{ fontSize: 13, color: "#6B6580", fontWeight: "600", marginBottom: 4 }}>
            Paso 1 de 2
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#1E1B2E", marginBottom: 12 }}>
            Configura tu sueldo mensual
          </Text>

          {/* Barra de progreso */}
          <View style={{ height: 6, backgroundColor: "#E8E4F0", borderRadius: 99, marginBottom: 30, overflow: "hidden" }}>
            <View style={{ width: "50%", height: "100%", backgroundColor: "#512DA8", borderRadius: 99 }} />
          </View>

          {/* Input Sueldo */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6580", marginBottom: 8 }}>
            Sueldo mensual neto (CLP)
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 2,
              borderColor: "#512DA8",
              paddingHorizontal: 16,
              height: 56,
              marginBottom: 28,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#512DA8", marginRight: 4 }}>$</Text>
            <TextInput
              value={sueldo}
              onChangeText={setSueldo}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#8A849C"
              style={{ flex: 1, fontSize: 20, fontWeight: "700", color: "#1E1B2E" }}
            />
            <Text style={{ fontSize: 14, color: "#8A849C", fontWeight: "600" }}>CLP</Text>
          </View>

          {/* Selector de Día de Pago */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6580", marginBottom: 12 }}>
            Día de pago
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 30 }}>
            {dias.map((d) => {
              const seleccionado = diaPago === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDiaPago(d)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: seleccionado ? "#512DA8" : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: seleccionado ? 0 : 1,
                    borderColor: "#E8E4F0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: seleccionado ? "#fff" : "#1E1B2E",
                    }}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botón Continuar */}
        <TouchableOpacity
          onPress={handleGuardarConfiguracion}
          style={{
            backgroundColor: "#512DA8",
            height: 52,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            Continuar →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}