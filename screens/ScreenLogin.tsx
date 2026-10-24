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
        // Redirige directo al Dashboard (2)
        onNav(2);
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
      style={{ flex: 1, backgroundColor: "#F5F3FA" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#512DA8",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Feather name="log-in" size={30} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#1E1B2E" }}>Iniciar Sesión</Text>
          <Text style={{ fontSize: 14, color: "#6B6580", marginTop: 4 }}>
            Bienvenido de nuevo a FinZen
          </Text>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2 }}>
          {/* Correo */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
            CORREO ELECTRÓNICO
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F3FA",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 16,
            }}
          >
            <Feather name="mail" size={18} color="#8A849C" />
            <TextInput
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#8A849C"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#1E1B2E" }}
            />
          </View>

          {/* Contraseña */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
            CONTRASEÑA
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F3FA",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 24,
            }}
          >
            <Feather name="lock" size={18} color="#8A849C" />
            <TextInput
              placeholder="Tu contraseña"
              placeholderTextColor="#8A849C"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPassword}
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#1E1B2E" }}
            />
            <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
              <Feather name={verPassword ? "eye" : "eye-off"} size={18} color="#8A849C" />
            </TouchableOpacity>
          </View>

          {/* Botón de Ingreso */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={cargando}
            style={{
              backgroundColor: "#512DA8",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Enlace para registrarse si no tiene cuenta */}
        <TouchableOpacity
          onPress={() => onNav(9)}
          style={{ marginTop: 20, alignItems: "center" }}
        >
          <Text style={{ color: "#6B6580", fontSize: 14 }}>
            ¿No tienes cuenta? <Text style={{ color: "#512DA8", fontWeight: "700" }}>Regístrate</Text>
          </Text>
        </TouchableOpacity>

        {/* Volver al Onboarding */}
        <TouchableOpacity
          onPress={() => onNav(0)}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#8A849C", fontSize: 13 }}>Volver al Inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}