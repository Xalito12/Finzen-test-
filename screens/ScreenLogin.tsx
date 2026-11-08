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

export default function ScreenLogin({ onNav }: { onNav: (i: number) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      setCargando(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert("Error de inicio de sesión", error.message);
        return;
      }

      if (data.session) {
        const { data: perfil, error: errorPerfil } = await supabase
          .from("perfiles")
          .select("sueldo")
          .eq("id", data.session.user.id)
          .single();
        if (errorPerfil) throw errorPerfil;
        onNav(Number(perfil.sueldo) > 0 ? 2 : 1);
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
        <View className="items-center mb-[32px]">
          <View className="w-[64px] h-[64px] rounded-[32px] bg-primary items-center justify-center mb-[16px]">
            <Feather name="log-in" size={30} color="#fff" />
          </View>
          <Text className="text-[24px] font-bold text-text">
            Iniciar Sesión
          </Text>
          <Text className="text-[14px] text-text-secondary mt-[4px]">
            Bienvenido de nuevo a FinZen
          </Text>
        </View>

        <View
          className="bg-card rounded-[16px] p-[20px]"
          style={{ elevation: 2 }}
        >
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
          <View className="flex-row items-center bg-bg rounded-[12px] px-[12px] mb-[24px]">
            <Feather name="lock" size={18} color="#8A849C" />
            <TextInput
              placeholder="Tu contraseña"
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

          {/* Botón de Ingreso */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={cargando}
            className="bg-primary py-[14px] rounded-[12px] items-center justify-center"
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-card font-bold text-[15px]">Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Enlace para registrarse si no tiene cuenta */}
        <TouchableOpacity
          onPress={() => onNav(9)}
          className="mt-[20px] items-center"
        >
          <Text className="text-text-secondary text-[14px]">
            ¿No tienes cuenta?{" "}
            <Text className="text-primary font-bold">Regístrate</Text>
          </Text>
        </TouchableOpacity>

        {/* Volver al Onboarding */}
        <TouchableOpacity
          onPress={() => onNav(0)}
          className="mt-[12px] items-center"
        >
          <Text className="text-muted text-[13px]">Volver al Inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
