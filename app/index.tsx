import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../database/supabase";
import FinzenTabs from "../navigation/FinzenTabs";
import ScreenLogin from "../screens/ScreenLogin";
import ScreenOnboarding from "../screens/ScreenOnboarding";
import ScreenRegister from "../screens/ScreenRegister";
import ScreenSalarySetup from "../screens/ScreenSalarySetup";

type Etapa =
  | "Comprobando"
  | "Bienvenida"
  | "Ingreso"
  | "Registro"
  | "Sueldo"
  | "Aplicacion"
  | "Error";

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("Comprobando");
  const [usuario, setUsuario] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const revision = useRef(0);

  const cargarSesion = useCallback(async () => {
    const solicitud = ++revision.current;
    setEtapa("Comprobando");
    setMensaje("");
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (solicitud !== revision.current) return;
      if (error) throw error;
      if (!session?.user) {
        setUsuario(null);
        setEtapa("Bienvenida");
        return;
      }
      const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles")
        .select("sueldo")
        .eq("id", session.user.id)
        .maybeSingle();
      if (solicitud !== revision.current) return;
      if (errorPerfil) throw errorPerfil;
      setUsuario(session.user.id);
      setEtapa(Number(perfil?.sueldo) > 0 ? "Aplicacion" : "Sueldo");
    } catch (error: unknown) {
      if (solicitud !== revision.current) return;
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo comprobar tu sesión.",
      );
      setEtapa("Error");
    }
  }, []);

  const volverABienvenida = useCallback(() => {
    revision.current += 1;
    setUsuario(null);
    setMensaje("");
    setEtapa("Bienvenida");
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") volverABienvenida();
      else if (event === "SIGNED_IN" && session?.user)
        setUsuario(session.user.id);
    });
    cargarSesion();
    return () => {
      revision.current += 1;
      subscription.unsubscribe();
    };
  }, [cargarSesion, volverABienvenida]);

  // Solo los formularios de acceso conservan sus callbacks anteriores.
  const navegarAcceso = useCallback(async (destino: number) => {
    const solicitud = ++revision.current;
    setMensaje("");
    if (destino === 0) {
      setEtapa("Bienvenida");
      return;
    }
    if (destino === 9) {
      setEtapa("Registro");
      return;
    }
    if (destino === 10) {
      setEtapa("Ingreso");
      return;
    }
    if (destino !== 1 && destino !== 2) return;
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (solicitud !== revision.current) return;
    if (error || !session?.user) {
      setUsuario(null);
      setMensaje(
        "Inicia sesión para continuar. Si acabas de registrarte, revisa si debes confirmar tu correo.",
      );
      setEtapa("Ingreso");
      return;
    }
    setUsuario(session.user.id);
    setEtapa(destino === 1 ? "Sueldo" : "Aplicacion");
  }, []);

  let contenido: React.ReactNode;
  switch (etapa) {
    case "Bienvenida":
      contenido = (
        <ScreenOnboarding
          onRegister={() => setEtapa("Registro")}
          onLogin={() => setEtapa("Ingreso")}
        />
      );
      break;
    case "Ingreso":
      contenido = <ScreenLogin onNav={navegarAcceso} />;
      break;
    case "Registro":
      contenido = <ScreenRegister onNav={navegarAcceso} />;
      break;
    case "Sueldo":
      contenido = <ScreenSalarySetup onNext={() => navegarAcceso(2)} />;
      break;
    case "Aplicacion":
      contenido = usuario ? (
        <FinzenTabs key={usuario} onSalir={volverABienvenida} />
      ) : (
        <ActivityIndicator color="#512DA8" />
      );
      break;
    case "Error":
      contenido = (
        <View className="flex-1 items-center justify-center p-[24px]">
          <Text className="text-text text-center">{mensaje}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={cargarSesion}
            className="bg-primary p-[16px] rounded-[12px] mt-[16px]"
          >
            <Text className="text-card font-bold">Reintentar</Text>
          </Pressable>
        </View>
      );
      break;
    default:
      contenido = (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#512DA8" />
        </View>
      );
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-bg">
        <StatusBar barStyle="light-content" />
        {mensaje && etapa === "Ingreso" ? (
          <Text accessibilityRole="alert" className="text-primary p-[12px]">
            {mensaje}
          </Text>
        ) : null}
        {contenido}
      </View>
    </SafeAreaProvider>
  );
}
