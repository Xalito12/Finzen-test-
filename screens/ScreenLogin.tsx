import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { supabase } from "../database/supabase";

// Pantalla para iniciar sesión mediante correo y contraseña.
// Recibe onNav para cambiar de pantalla utilizando un destino numérico.
export default function ScreenLogin({ onNav }: { onNav: (i: number) => void }) {
  // Guarda las credenciales ingresadas en el formulario.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Controla el indicador de carga y la visibilidad de la contraseña.
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  // Valida los campos e inicia sesión en Supabase.
  // Luego consulta el sueldo para decidir si abre Inicio o la configuración inicial.
  const handleLogin = async () => {
    // Solicita completar ambos campos antes de intentar iniciar sesión.
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

      // Muestra el error y detiene el proceso si falla la autenticación.
      if (error) {
        Alert.alert("Error de inicio de sesión", error.message);
        return;
      }

      // Consulta el perfil únicamente cuando se obtiene una sesión válida.
      if (data.session) {
        const { data: perfil, error: errorPerfil } = await supabase
          .from("perfiles")
          .select("sueldo")
          .eq("id", data.session.user.id)
          .maybeSingle();

        // Envía el error al bloque catch si no se pudo consultar el perfil.
        if (errorPerfil) throw errorPerfil;

        // Abre Inicio si existe un sueldo positivo; en otro caso, pide configurarlo.
        onNav(Number(perfil?.sueldo) > 0 ? 2 : 1);
      }
    } catch (err: any) {
      // Informa los errores producidos durante el proceso.
      Alert.alert("Error inesperado", err.message || "Ocurrió un error.");
    } finally {
      // Finaliza el indicador de carga tanto si la operación funciona como si falla.
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
        {/* Encabezado con el icono y el mensaje de bienvenida. */}
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

            {/* Alterna entre mostrar y ocultar la contraseña. */}
            <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
              <Feather
                name={verPassword ? "eye" : "eye-off"}
                size={18}
                color="#8A849C"
              />
            </TouchableOpacity>
          </View>

          {/* Botón de Ingreso */}
          {/* Se desactiva y muestra un indicador mientras se procesa la solicitud. */}
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
