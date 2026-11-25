import AsyncStorage from "@react-native-async-storage/async-storage";
import { indiceSeguroTutorial, pasosTutorial } from "../tutorial/pasos";
import { supabase } from "./supabase";

// Versión del tutorial utilizada para identificar el progreso guardado.
export const VERSION_TUTORIAL = 1;
// Define los datos que representan el avance del usuario en el tutorial.
export interface ProgresoTutorial {
  version: number;
  paso: number;
  completado: boolean;
  repeticion: boolean;
}
// Define el estado necesario para iniciar o retomar el tutorial.
export interface EstadoInicialTutorial {
  activo: boolean;
  progreso: ProgresoTutorial;
  sincronizarFinal: boolean;
  mensaje: string;
}
// Genera una clave de almacenamiento distinta para cada usuario y versión.
export function claveTutorial(usuarioId: string): string {
  return `finzen:tutorial:v${VERSION_TUTORIAL}:${usuarioId}`;
}
// Crea el progreso inicial en el primer paso y permite indicar si es una repetición.
export function progresoInicialTutorial(repeticion = false): ProgresoTutorial {
  return { version: VERSION_TUTORIAL, paso: 0, completado: false, repeticion };
}
// Convierte el texto guardado en un progreso válido.
// Devuelve null cuando los datos están ausentes, dañados o son incompatibles.
export function interpretarProgresoTutorial(
  valor: string | null,
): ProgresoTutorial | null {
  // Si no hay información guardada, devuelve null.
  if (!valor) return null;
  try {
    const dato = JSON.parse(valor) as Partial<ProgresoTutorial>;
    // Rechaza el progreso si la versión no coincide o sus campos son inválidos.
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
// Combina el avance local con la información del tutorial presente en la sesión.
// Decide si la guía debe mostrarse y si su final necesita sincronizarse.
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
    mensaje ="La guía funciona, pero no se pudo recuperar su avance en este dispositivo.";
  }
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  // Propaga el error si falla la consulta de la sesión.
  if (error) throw error;
  // Impide continuar si falta la sesión o pertenece a otro usuario.
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
  // Si la cuenta ya completó esta versión del tutorial, devuelve la guía inactiva.
  if (terminadoRemoto)
    return {
      activo: false,
      progreso: { ...(local || progresoInicialTutorial()), completado: true },
      sincronizarFinal: false,
      mensaje,
    };
  // Si terminó localmente, desactiva la guía e indica si falta sincronizar el final.
  if (local?.completado)
    return {
      activo: false,
      progreso: local,
      sincronizarFinal: pendiente,
      mensaje,
    };
  // Si hay un avance local sin completar, permite continuar desde ese progreso.
  if (local)
    return { activo: true, progreso: local, sincronizarFinal: false, mensaje };
  // Cuando no hay avance local, utiliza el estado inicial y la marca de pendiente.
  return {
    activo: pendiente,
    progreso: progresoInicialTutorial(),
    sincronizarFinal: false,
    mensaje,
  };
}
// Guarda el progreso en el dispositivo utilizando la clave del usuario.
// Asegura que se almacenen la versión actual y un índice de paso válido.
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
// Marca el tutorial como completado en los metadatos de la cuenta de Supabase.
// Antes de actualizar, comprueba que la sesión corresponda al usuario indicado.
export async function sincronizarTutorialCompletado(
  usuarioId: string,
): Promise<void> {
  const {
    data: { session },
    error: errorSesion,
  } = await supabase.auth.getSession();
  // Propaga el error si no se pudo obtener la sesión.
  if (errorSesion) throw errorSesion;
  // Detiene la actualización si falta la sesión o cambió el usuario.
  if (!session?.user || session.user.id !== usuarioId)
    throw new Error("La sesión cambió antes de guardar el tutorial.");
  const { error } = await supabase.auth.updateUser({
    data: {
      finzen_tutorial_pendiente: false,
      finzen_tutorial_version: VERSION_TUTORIAL,
    },
  });
  // Propaga cualquier error al guardar los cambios en la cuenta.
  if (error) throw error;
}
// Genera el progreso final con el último paso y el tutorial marcado como completado.
export function progresoCompletadoTutorial(): ProgresoTutorial {
  return {
    version: VERSION_TUTORIAL,
    paso: pasosTutorial.length - 1,
    completado: true,
    repeticion: false,
  };
}
