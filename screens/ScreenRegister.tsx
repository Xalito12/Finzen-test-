// screens/ScreenRegister.tsx
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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

export default function ScreenRegister({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setCargando(true);
      // Pasamos 'nombre' en options.data para que quede en auth.users
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { nombre: nombre.trim() },
        },
      });

      if (error) {
        Alert.alert("Error al registrar", error.message);
        return;
      }

      if (data?.user) {
        // Insertar el perfil en Supabase
        await supabase.from("perfiles").upsert({
          id: data.user.id,
          nombre: nombre.trim(),
          sueldo: 0,
          dia_pago: 1,
        });

        Alert.alert("¡Bienvenido!", "Tu cuenta ha sido creada exitosamente.", [
          { text: "Continuar", onPress: () => onNav(1) }, // Lleva a configurar sueldo
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "Ocurrió un error.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View className="items-center mb-[28px]">
          <View className="w-[64px] h-[64px] rounded-[32px] bg-primary items-center justify-center mb-[16px]">
            <Feather name="user-plus" size={30} color="#fff" />
          </View>
          <Text className="text-[24px] font-bold text-text">Crear Cuenta</Text>
          <Text className="text-[14px] text-text-secondary mt-[4px]">
            Únete para sincronizar tus finanzas
          </Text>
        </View>

        <View
          className="bg-card rounded-[16px] p-[20px]"
          style={{ elevation: 2 }}
        >
          {/* Nombre completo */}
          <Text className="text-[12px] font-semibold text-text-secondary mb-[6px]">
            TU NOMBRE
          </Text>
          <View className="flex-row items-center bg-bg rounded-[12px] px-[12px] mb-[16px]">
            <Feather name="user" size={18} color="#8A849C" />
            <TextInput
              placeholder="Ej. Renato"
              placeholderTextColor="#8A849C"
              value={nombre}
              onChangeText={setNombre}
              className="flex-1 py-[12px] px-[10px] text-text"
            />
          </View>

          {/* Correo */}
          <Text className="text-[12px] font-semibold text-text-secondary mb-[6px]">
            CORREO ELECTRÓNICO
          </Text>
          <View className="flex-row items-center bg-bg rounded-[12px] px-[12px] mb-[16px]">
            <Feather name="mail" size={18} color="#8A849C" />
            <TextInput
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#8A849C"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 py-[12px] px-[10px] text-text"
            />
          </View>

          {/* Contraseña */}
          <Text className="text-[12px] font-semibold text-text-secondary mb-[6px]">
            CONTRASEÑA
          </Text>
          <View className="flex-row items-center bg-bg rounded-[12px] px-[12px] mb-[16px]">
            <Feather name="lock" size={18} color="#8A849C" />
            <TextInput
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#8A849C"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPassword}
              className="flex-1 py-[12px] px-[10px] text-text"
            />
            <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
              <Feather
                name={verPassword ? "eye" : "eye-off"}
                size={18}
                color="#8A849C"
              />
            </TouchableOpacity>
          </View>

          {/* Confirmar Contraseña */}
          <Text className="text-[12px] font-semibold text-text-secondary mb-[6px]">
            CONFIRMAR CONTRASEÑA
          </Text>
          <View className="flex-row items-center bg-bg rounded-[12px] px-[12px] mb-[24px]">
            <Feather name="check-circle" size={18} color="#8A849C" />
            <TextInput
              placeholder="Repite tu contraseña"
              placeholderTextColor="#8A849C"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!verPassword}
              className="flex-1 py-[12px] px-[10px] text-text"
            />
          </View>

          <TouchableOpacity
            onPress={handleRegistro}
            disabled={cargando}
            className="bg-primary py-[14px] rounded-[12px] items-center justify-center"
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-card font-bold text-[15px]">
                Registrarse
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => onNav(10)}
          className="mt-[20px] items-center"
        >
          <Text className="text-text-secondary text-[14px]">
            ¿Ya tienes cuenta?{" "}
            <Text className="text-primary font-bold">Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
