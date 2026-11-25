import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { supabase } from "../database/supabase";

// Pantalla para crear una cuenta mediante correo y contraseña.
// Prepara el perfil cuando existe una sesión y permite continuar con la configuración.
export default function ScreenRegister({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Guarda los datos ingresados en el formulario.
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Controla el indicador de carga y la visibilidad de las contraseñas.
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  // Bloquea nuevos intentos mientras se procesa un registro.
  const registroEnCurso = useRef(false);

  // Valida el formulario, solicita el registro y prepara los datos iniciales del perfil.
  // Si no se obtiene una sesión, muestra las indicaciones para confirmar el correo.
  const handleRegistro = async () => {
    // Evita procesar más de un registro al mismo tiempo.
    if (registroEnCurso.current) return;

    // Solicita completar el nombre, el correo y la contraseña.
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor completa todos los campos.");
      return;
    }

    // Rechaza el registro si las contraseñas ingresadas son diferentes.
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    // Exige una contraseña de al menos seis caracteres.
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    registroEnCurso.current = true;

    try {
      setCargando(true);

      // Pasamos 'nombre' en options.data para que quede en auth.users.
      // También dejamos marcado que el usuario tiene pendiente realizar el tutorial.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { nombre: nombre.trim(), finzen_tutorial_pendiente: true },
        },
      });

      // Muestra el error y detiene el proceso si falla la solicitud de registro.
      if (error) {
        Alert.alert("Error al registrar", error.message);
        return;
      }

      // Si falta la sesión o el usuario, muestra las indicaciones para confirmar el correo.
      // El botón del aviso permite abrir la pantalla de inicio de sesión.
      if (!data?.session || !data.user) {
        Alert.alert(
          "Revisa tu correo",
          "Si el registro se completó, recibirás un enlace para confirmar tu correo. Después inicia sesión para configurar tu presupuesto y comenzar la guía.",
          [{ text: "Ir a iniciar sesión", onPress: () => onNav(10) }],
        );
        return;
      }

      // Solo se escribe con una sesión autenticada. Configuración podrá
      // recuperar el perfil con un upsert si esta preparación inicial falla.
      const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles")
        .upsert({
          id: data.user.id,
          nombre: nombre.trim(),
          sueldo: 0,
          dia_pago: 1,
        })
        .select("id")
        .single();

      // Si falla la preparación del perfil o no se confirma su resultado,
      // permite continuar a la configuración para volver a intentarlo.
      if (errorPerfil || !perfil) {
        Alert.alert(
          "Completa tu configuración",
          "Tu cuenta tiene una sesión activa, pero no se pudo preparar el perfil. Al guardar tu presupuesto volveremos a intentarlo.",
          [{ text: "Configurar presupuesto", onPress: () => onNav(1) }],
        );
        return;
      }

      // Continúa con la configuración inicial del sueldo y del día de pago.
      onNav(1);
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "Ocurrió un error.");
    } finally {
      // Libera el bloqueo y finaliza el indicador de carga al terminar el intento.
      registroEnCurso.current = false;
      setCargando(false);
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
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Encabezado con el icono y el mensaje de presentación. */}
        <View className="items-center mb-[28px]">
          <View className="w-[64px] h-[64px] rounded-[32px] bg-primary items-center justify-center mb-[16px]">
            <Feather name="user-plus" size={30} color="#fff" />
          </View>
          <Text className="text-[24px] font-bold text-text">Crear Cuenta</Text>
          <Text className="text-[14px] text-text-secondary mt-[4px]">
            Únete para sincronizar tus finanzas
          </Text>
        </View>

        {/* Los campos del formulario se desactivan durante el registro. */}
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
              editable={!cargando}
              accessibilityLabel="Tu nombre"
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
              editable={!cargando}
              accessibilityLabel="Correo electrónico"
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
              editable={!cargando}
              accessibilityLabel="Contraseña"
              secureTextEntry={!verPassword}
              className="flex-1 py-[12px] px-[10px] text-text"
            />

            {/* Alterna la visibilidad de ambos campos de contraseña. */}
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
              editable={!cargando}
              accessibilityLabel="Confirmar contraseña"
              secureTextEntry={!verPassword}
              className="flex-1 py-[12px] px-[10px] text-text"
            />
          </View>

          {/* Inicia el registro y muestra un indicador mientras se procesa. */}
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

        {/* Abre el inicio de sesión si el usuario ya tiene una cuenta. */}
        <TouchableOpacity
          disabled={cargando}
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
