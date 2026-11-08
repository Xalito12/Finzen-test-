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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Error", "Sesión no encontrada.");
      return;
    }

    // Las categorías iniciales pertenecen a la configuración inicial, no a la lectura.
    const { data: perfil, error: errorPerfil } = await supabase
      .from("perfiles")
      .select("sueldo")
      .eq("id", user.id)
      .single();
    if (errorPerfil) {
      Alert.alert("Error al cargar configuración", errorPerfil.message);
      return;
    }
    if (!perfil.sueldo || Number(perfil.sueldo) <= 0) {
      const { data: existentes, error: errorCategorias } = await supabase
        .from("categorias")
        .select("id")
        .eq("usuario_id", user.id)
        .limit(1);
      if (errorCategorias) {
        Alert.alert("Error al cargar categorías", errorCategorias.message);
        return;
      }
      if (existentes.length === 0) {
        const { error: errorIniciales } = await supabase
          .from("categorias")
          .insert([
            {
              usuario_id: user.id,
              nombre: "Alimentación",
              icono: "🍔",
              limite: 160000,
              color: "#7E57C2",
            },
            {
              usuario_id: user.id,
              nombre: "Transporte",
              icono: "🚗",
              limite: 80000,
              color: "#F9A825",
            },
            {
              usuario_id: user.id,
              nombre: "Compras",
              icono: "🛍️",
              limite: 130000,
              color: "#C62828",
            },
            {
              usuario_id: user.id,
              nombre: "Salud",
              icono: "❤️",
              limite: 55000,
              color: "#2E7D32",
            },
          ]);
        if (errorIniciales) {
          Alert.alert("Error al crear categorías", errorIniciales.message);
          return;
        }
      }
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
      className="flex-1 bg-bg"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: "space-between",
        }}
      >
        <View>
          {/* Encabezado con Icono */}
          <View className="w-[44px] h-[44px] rounded-[12px] bg-border items-center justify-center mb-[20px] mt-[10px]">
            <Feather name="credit-card" size={22} color="#512DA8" />
          </View>

          <Text className="text-[13px] text-text-secondary font-semibold mb-[4px]">
            Paso 1 de 2
          </Text>
          <Text className="text-[26px] font-extrabold text-text mb-[12px]">
            Configura tu sueldo mensual
          </Text>

          {/* Barra de progreso */}
          <View className="h-[6px] bg-border rounded-[99px] mb-[30px] overflow-hidden">
            <View className="w-[50%] h-[100%] bg-primary rounded-[99px]" />
          </View>

          {/* Input Sueldo */}
          <Text className="text-[13px] font-semibold text-text-secondary mb-[8px]">
            Sueldo mensual neto (CLP)
          </Text>
          <View className="flex-row items-center bg-card rounded-[14px] border-[2px] border-primary px-[16px] h-[56px] mb-[28px]">
            <Text className="text-[20px] font-bold text-primary mr-[4px]">
              $
            </Text>
            <TextInput
              value={sueldo}
              onChangeText={setSueldo}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#8A849C"
              className="flex-1 text-[20px] font-bold text-text"
            />
            <Text className="text-[14px] text-muted font-semibold">CLP</Text>
          </View>

          {/* Selector de Día de Pago */}
          <Text className="text-[13px] font-semibold text-text-secondary mb-[12px]">
            Día de pago
          </Text>
          <View className="flex-row flex-wrap gap-[10px] mb-[30px]">
            {dias.map((d) => {
              const seleccionado = diaPago === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDiaPago(d)}
                  className="w-[52px] h-[52px] rounded-[12px] items-center justify-center border-border"
                  style={{
                    backgroundColor: seleccionado ? "#512DA8" : "#fff",
                    borderWidth: seleccionado ? 0 : 1,
                  }}
                >
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: seleccionado ? "#fff" : "#1E1B2E" }}
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
          className="bg-primary h-[52px] rounded-[14px] items-center justify-center mb-[10px]"
        >
          <Text className="text-card font-bold text-[16px]">Continuar →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
