import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { indiceSeguroTutorial, pasosTutorial } from "../tutorial/pasos";

export const VERSION_TUTORIAL = 1;
export interface ProgresoTutorial {
  version: number;
  paso: number;
  completado: boolean;
  repeticion: boolean;
}
export interface EstadoInicialTutorial {
  activo: boolean;
  progreso: ProgresoTutorial;
  sincronizarFinal: boolean;
  mensaje: string;
}
export function claveTutorial(usuarioId: string): string {
  return `finzen:tutorial:v${VERSION_TUTORIAL}:${usuarioId}`;
}
export function progresoInicialTutorial(repeticion = false): ProgresoTutorial {
  return { version: VERSION_TUTORIAL, paso: 0, completado: false, repeticion };
}
export function interpretarProgresoTutorial(
  valor: string | null,
): ProgresoTutorial | null {
  if (!valor) return null;
  try {
    const dato = JSON.parse(valor) as Partial<ProgresoTutorial>;
    if (
      dato.version !== VERSION_TUTORIAL ||
      typeof dato.completado !== "boolean" ||
      typeof dato.paso !== "number" ||
      !Number.isInteger(dato.paso)
    )
      return null;
    return {
      version: VERSION_TUTORIAL,
      paso: indiceSeguroTutorial(dato.paso),
      completado: dato.completado,
      repeticion: dato.repeticion === true,
    };
  } catch {
    return null;
  }
}
export async function cargarEstadoTutorial(
  usuarioId: string,
): Promise<EstadoInicialTutorial> {
  let local: ProgresoTutorial | null = null;
  let mensaje = "";
  try {
    local = interpretarProgresoTutorial(
      await AsyncStorage.getItem(claveTutorial(usuarioId)),
    );
  } catch {
    mensaje =
      "La guía funciona, pero no se pudo recuperar su avance en este dispositivo.";
  }
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user || session.user.id !== usuarioId)
    throw new Error(
      "La sesión cambió. Vuelve a entrar para continuar la guía.",
    );
  const metadata = session.user.user_metadata || {};
  const pendiente = metadata.finzen_tutorial_pendiente === true;
  const terminadoRemoto =
    Number(metadata.finzen_tutorial_version) >= VERSION_TUTORIAL && !pendiente;
  // Una repetición voluntaria se retoma incluso si la cuenta ya completó el recorrido.
  if (local?.repeticion && !local.completado)
    return { activo: true, progreso: local, sincronizarFinal: false, mensaje };
  if (terminadoRemoto)
    return {
      activo: false,
      progreso: { ...(local || progresoInicialTutorial()), completado: true },
      sincronizarFinal: false,
      mensaje,
    };
  if (local?.completado)
    return {
      activo: false,
      progreso: local,
      sincronizarFinal: pendiente,
      mensaje,
    };
  if (local)
    return { activo: true, progreso: local, sincronizarFinal: false, mensaje };
  return {
    activo: pendiente,
    progreso: progresoInicialTutorial(),
    sincronizarFinal: false,
    mensaje,
  };
}
export async function guardarProgresoTutorial(
  usuarioId: string,
  progreso: ProgresoTutorial,
): Promise<void> {
  await AsyncStorage.setItem(
    claveTutorial(usuarioId),
    JSON.stringify({
      ...progreso,
      version: VERSION_TUTORIAL,
      paso: indiceSeguroTutorial(progreso.paso),
    }),
  );
}
export async function sincronizarTutorialCompletado(
  usuarioId: string,
): Promise<void> {
  const {
    data: { session },
    error: errorSesion,
  } = await supabase.auth.getSession();
  if (errorSesion) throw errorSesion;
  if (!session?.user || session.user.id !== usuarioId)
    throw new Error("La sesión cambió antes de guardar el tutorial.");
  const { error } = await supabase.auth.updateUser({
    data: {
      finzen_tutorial_pendiente: false,
      finzen_tutorial_version: VERSION_TUTORIAL,
    },
  });
  if (error) throw error;
}
export function progresoCompletadoTutorial(): ProgresoTutorial {
  return {
    version: VERSION_TUTORIAL,
    paso: pasosTutorial.length - 1,
    completado: true,
    repeticion: false,
  };
}
