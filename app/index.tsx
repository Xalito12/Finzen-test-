// Importa React y los hooks utilizados para manejar estados, efectos y referencias.
import React, { useCallback, useEffect, useRef, useState } from "react";
// Importa los componentes visuales utilizados en la aplicación.
import { ActivityIndicator, Pressable, StatusBar, Text, View, } from "react-native";
// Importa el contenedor que respeta las áreas seguras del dispositivo.
import { SafeAreaView } from "react-native-safe-area-context";
// Importa los estilos compartidos para centrar el contenido.
import { layout } from "../components/layout";
// Importa la conexión con Supabase.
import { supabase } from "../database/supabase";
// Importa la navegación principal de la aplicación.
import FinzenTabs from "../navigation/FinzenTabs";
// Importa las pantallas del proceso de acceso y configuración inicial.
import ScreenLogin from "../screens/ScreenLogin";
import ScreenOnboarding from "../screens/ScreenOnboarding";
import ScreenRegister from "../screens/ScreenRegister";
import ScreenSalarySetup from "../screens/ScreenSalarySetup";

// Define las etapas posibles de la aplicación.
type Etapa =
  | "Comprobando"
  | "Bienvenida"
  | "Ingreso"
  | "Registro"
  | "Sueldo"
  | "Aplicacion"
  | "Error";

// Componente principal que decide qué pantalla mostrar.
export default function App() {
  // Guarda la etapa actual. Inicialmente se comprueba la sesión.
  const [etapa, setEtapa] = useState<Etapa>("Comprobando");
  // Guarda el identificador del usuario que inició sesión.
  const [usuario, setUsuario] = useState<string | null>(null);
  // Guarda los mensajes que se mostrarán al usuario.
  const [mensaje, setMensaje] = useState("");
  // Identifica la operación más reciente para descartar respuestas anteriores.
  const revision = useRef(0);

  // Consulta la sesión y determina si corresponde mostrar el acceso,
  // configurar el sueldo o entrar a la aplicación.
  const cargarSesion = useCallback(async () => {
    // Asigna un número a esta solicitud.
    const solicitud = ++revision.current;
    setEtapa("Comprobando");
    setMensaje("");
    try {
      // Obtiene la sesión actual desde Supabase.
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      // Descarta la respuesta si comenzó otra operación mientras se esperaba.
      if (solicitud !== revision.current) return;
      // Envía el error al bloque catch.
      if (error) throw error;
      // Si no hay un usuario con sesión, muestra la bienvenida.
      if (!session?.user) {
        setUsuario(null);
        setEtapa("Bienvenida");
        return;
      }
      // Consulta el sueldo guardado en el perfil del usuario.
      const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles")
        .select("sueldo")
        .eq("id", session.user.id)
        .maybeSingle();
      // Comprueba que la consulta todavía corresponda a la operación actual.
      if (solicitud !== revision.current) return;
      if (errorPerfil) throw errorPerfil;
      // Guarda el usuario y decide si necesita configurar su sueldo.
      setUsuario(session.user.id);
      setEtapa(Number(perfil?.sueldo) > 0 ? "Aplicacion" : "Sueldo");
    } catch (error: unknown) {
      // Evita mostrar errores de una operación que ya fue reemplazada.
      if (solicitud !== revision.current) return;
      // Guarda el mensaje del error o un mensaje general.
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo comprobar tu sesión.",
      );
      // Activa la pantalla que permite reintentar.
      setEtapa("Error");
    }
  }, []);

  // Limpia los datos de acceso y vuelve a la pantalla de bienvenida.
  const volverABienvenida = useCallback(() => {
    // Invalida las consultas anteriores que todavía puedan estar pendientes.
    revision.current += 1;
    setUsuario(null);
    setMensaje("");
    setEtapa("Bienvenida");
  }, []);

  // Escucha los cambios de autenticación y comprueba la sesión al iniciar.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Vuelve a la bienvenida cuando se cierra la sesión.
      if (event === "SIGNED_OUT") volverABienvenida();
      // Actualiza el identificador cuando se inicia sesión.
      else if (event === "SIGNED_IN" && session?.user)
        setUsuario(session.user.id);
    });
    cargarSesion();
    // Deja de escuchar los eventos al desmontar el componente.
    return () => {
      revision.current += 1;
      subscription.unsubscribe();
    };
  }, [cargarSesion, volverABienvenida]);

  // Solo los formularios de acceso conservan sus callbacks anteriores.
  // Recibe un número de destino y selecciona la etapa correspondiente.
  const navegarAcceso = useCallback(async (destino: number) => {
    const solicitud = ++revision.current;
    setMensaje("");
    // El destino 0 abre la bienvenida.
    if (destino === 0) {
      setEtapa("Bienvenida");
      return;
    }
    // El destino 9 abre el formulario de registro.
    if (destino === 9) {
      setEtapa("Registro");
      return;
    }
    // El destino 10 abre el formulario de inicio de sesión.
    if (destino === 10) {
      setEtapa("Ingreso");
      return;
    }
    // Los destinos 1 y 2 requieren comprobar que exista una sesión.
    if (destino !== 1 && destino !== 2) return;
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (solicitud !== revision.current) return;
    // Si no hay sesión o ocurrió un error, solicita iniciar sesión.
    if (error || !session?.user) {
      setUsuario(null);
      setMensaje(
        "Inicia sesión para continuar. Si acabas de registrarte, revisa si debes confirmar tu correo.",
      );
      setEtapa("Ingreso");
      return;
    }
    // El destino 1 abre la configuración del sueldo.
    // El destino 2 abre la aplicación principal.
    setUsuario(session.user.id);
    setEtapa(destino === 1 ? "Sueldo" : "Aplicacion");
  }, []);

  // Guarda el contenido visual que se mostrará según la etapa.
  let contenido: React.ReactNode;
  switch (etapa) {
    // Pantalla de bienvenida con opciones para registrarse o iniciar sesión.
    case "Bienvenida":
      contenido = (
        <ScreenOnboarding
          onRegister={() => setEtapa("Registro")}
          onLogin={() => setEtapa("Ingreso")}
        />
      );
      break;
    // Formulario de inicio de sesión.
    case "Ingreso":
      contenido = <ScreenLogin onNav={navegarAcceso} />;
      break;
    // Formulario para crear una cuenta.
    case "Registro":
      contenido = <ScreenRegister onNav={navegarAcceso} />;
      break;
    // Pantalla para configurar el presupuesto inicial.
    case "Sueldo":
      contenido = <ScreenSalarySetup onNext={() => navegarAcceso(2)} />;
      break;
    // Navegación principal cuando existe un usuario identificado.
    case "Aplicacion":
      contenido = usuario ? (
        <FinzenTabs
          key={usuario}
          usuarioId={usuario}
          onSalir={volverABienvenida}
        />
      ) : (
        <ActivityIndicator color="#512DA8" />
      );
      break;
    // Muestra el error y un botón para volver a comprobar la sesión.
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
    // Muestra un indicador de carga durante la etapa de comprobación.
    default:
      contenido = (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#512DA8" />
        </View>
      );
  }

   // Construye el contenedor general de la pantalla.
   return (
    <SafeAreaView
      edges={
        // En la aplicación principal, la barra inferior gestiona su margen.
        // En las pantallas de acceso también se reserva el espacio inferior.
        etapa === "Aplicacion"
          ? ["left", "right"]
          : ["left", "right", "bottom"]
      }
      style={{
        // Ocupa el espacio disponible.
        flex: 1,
        // Cambia el fondo según la etapa que se está mostrando.
        backgroundColor:
          etapa === "Bienvenida" ? "#3F51B5" : "#F5F3FA",
      }}
    >
      {/* Centra el contenido utilizando los estilos compartidos. */}
      <View style={layout.frame}>
        {/* Usa texto e iconos claros en la barra de estado del teléfono. */}
        <StatusBar barStyle="light-content" />

        {/* Muestra el aviso de acceso cuando hay un mensaje en la etapa Ingreso. */}
        {mensaje && etapa === "Ingreso" ? (
          <Text
            accessibilityRole="alert"
            className="text-primary p-[12px]"
          >
            {mensaje}
          </Text>
        ) : null}

        {/* Renderiza la pantalla seleccionada mediante el switch. */}
        {contenido}
      </View>
    </SafeAreaView>
  );
  }
