import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";

import {
  ActivityIndicator,
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
  const [sueldo, setSueldo] = useState("");
  const [diaPago, setDiaPago] = useState("1");
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  const dias = [1, 5, 10, 15, 20, 25, 28, 30, 31];

  const handleGuardarConfiguracion = async () => {
    if (guardandoRef.current) return;
    const textoSueldo = sueldo.trim().replace(/[.$\s]/g, "");
    const monto = Number(textoSueldo);
    const dia = Number(diaPago);
    if (
      !/^\d+$/.test(textoSueldo) ||
      !Number.isSafeInteger(monto) ||
      monto <= 0
    ) {
      Alert.alert(
        "Revisa el sueldo",
        "Ingresa un sueldo mensual válido en pesos chilenos, mayor que cero.",
      );
      return;
    }
    if (
      !/^\d{1,2}$/.test(diaPago.trim()) ||
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 31
    ) {
      Alert.alert(
        "Revisa el día de pago",
        "El día debe ser un número entre 1 y 31.",
      );
      return;
    }
    guardandoRef.current = true;
    setGuardando(true);
    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();
      if (errorSesion) throw errorSesion;
      if (!session?.user)
        throw new Error("Inicia sesión para guardar tu presupuesto.");
      const user = session.user;
      const nombre =
        user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
      // Guardar una cuenta no crea categorías. El usuario elige la primera
      // durante el tutorial y las cuentas existentes conservan sus datos.
      const { data: perfil, error } = await supabase
        .from("perfiles")
        .upsert({
          id: user.id,
          nombre,
          sueldo: monto,
          dia_pago: dia,
        })
        .select("id, sueldo, dia_pago")
        .single();
      if (error) throw error;
      if (
        !perfil ||
        perfil.id !== user.id ||
        Number(perfil.sueldo) !== monto ||
        Number(perfil.dia_pago) !== dia
      ) {
        throw new Error(
          "No se pudo confirmar la configuración. Inténtalo nuevamente.",
        );
      }
      onNext();
    } catch (error: unknown) {
      const mensaje =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "No se pudo guardar la configuración.";
      Alert.alert("No se pudo guardar", mensaje);
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
            Configuración inicial
          </Text>
          <Text className="text-[26px] font-extrabold text-text mb-[12px]">
            Configura tu presupuesto
          </Text>

          <Text className="text-[14px] text-text-secondary mb-[24px]">
            Define tu ingreso y día de pago. Después crearás tu primera
            categoría y conocerás las secciones de FinZen con una guía paso a
            paso.
          </Text>

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
              editable={!guardando}
              accessibilityLabel="Sueldo mensual neto"
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
              const seleccionado = Number(diaPago) === d;
              return (
                <TouchableOpacity
                  key={d}
                  disabled={guardando}
                  accessibilityRole="button"
                  accessibilityLabel={`Día de pago ${d}`}
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => setDiaPago(String(d))}
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
          <Text className="text-[13px] text-text-secondary mb-[8px]">
            O escribe otro día del mes (1 al 31)
          </Text>
          <TextInput
            value={diaPago}
            onChangeText={setDiaPago}
            keyboardType="number-pad"
            maxLength={2}
            editable={!guardando}
            accessibilityLabel="Día de pago del 1 al 31"
            className="bg-card rounded-[12px] px-[16px] h-[48px] text-text mb-[24px]"
          />
        </View>

        {/* Botón Continuar */}
        <TouchableOpacity
          disabled={guardando}
          accessibilityRole="button"
          accessibilityLabel="Guardar presupuesto y continuar"
          accessibilityState={{ disabled: guardando }}
          onPress={handleGuardarConfiguracion}
          className="bg-primary h-[52px] rounded-[14px] items-center justify-center mb-[10px]"
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-card font-bold text-[16px]">
              Guardar y continuar
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
