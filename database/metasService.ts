import { fechaLocalValida } from "../models/metas";
import { supabase } from "./supabase";

// Define los datos completos de una meta de ahorro guardada.
export interface MetaAhorro {
  id: string;
  usuario_id: string;
  nombre: string;
  monto_objetivo: number;
  monto_ahorrado: number;
  fecha_objetivo: string | null;
  updated_at: string;
}
// Define los datos utilizados para crear o modificar una meta.
export interface DatosMeta {
  nombre: string;
  monto_objetivo: number;
  monto_ahorrado?: number;
  fecha_objetivo: string | null;
}
const columnas =
  "id, usuario_id, nombre, monto_objetivo, monto_ahorrado, fecha_objetivo, updated_at";

// Genera un mensaje para el usuario según el error recibido.
// Identifica errores relacionados con la configuración de Metas en Supabase.
export function mensajeErrorMetas(error: unknown): string {
  const info = error as { code?: string; message?: string } | null;
  if (
    info?.code === "42P01" ||
    info?.code === "PGRST205" ||
    info?.code === "PGRST202" ||
    info?.code === "42883"
  ) {
    return "Falta configurar Metas en Supabase. Ejecuta el archivo 20261115_metas_ahorro.sql y vuelve a intentar.";
  }
  return (
    info?.message ||
    "No se pudo guardar el cambio. Revisa tu conexión e inténtalo nuevamente."
  );
}
// Interrumpe la operación lanzando un error con el mensaje correspondiente.
function fallo(error: unknown): never {
  throw new Error(mensajeErrorMetas(error));
}
// Convierte un registro de la base de datos al formato MetaAhorro.
// Comprueba que el objetivo sea positivo y el ahorro sea cero o mayor.
function normalizar(fila: Record<string, unknown>): MetaAhorro {
  const objetivo = Number(fila.monto_objetivo),
    ahorrado = Number(fila.monto_ahorrado);
  if (
    !Number.isFinite(objetivo) ||
    objetivo <= 0 ||
    !Number.isFinite(ahorrado) ||
    ahorrado < 0
  )
    throw new Error("La meta tiene montos no válidos.");
  return {
    id: String(fila.id),
    usuario_id: String(fila.usuario_id),
    nombre: String(fila.nombre),
    monto_objetivo: objetivo,
    monto_ahorrado: ahorrado,
    fecha_objetivo: fila.fecha_objetivo ? String(fila.fecha_objetivo) : null,
    updated_at: String(fila.updated_at),
  };
}
// Obtiene el identificador del usuario de la sesión activa.
// Lanza un error si falla la consulta o no existe una sesión.
async function usuarioActual(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) fallo(error);
  if (!session?.user)
    throw new Error("Inicia sesión para administrar tus metas.");
  return session.user.id;
}
// Comprueba el nombre, los montos y la fecha antes de guardar una meta.
// Lanza un error cuando alguno de los datos no cumple los requisitos.
function validar(datos: DatosMeta) {
  if (!datos.nombre.trim() || datos.nombre.trim().length > 80)
    throw new Error("Escribe un nombre de hasta 80 caracteres.");
  if (
    !Number.isFinite(datos.monto_objetivo) ||
    datos.monto_objetivo <= 0 ||
    datos.monto_objetivo > 999999999999.99
  )
    throw new Error("El monto objetivo debe ser mayor que cero.");
  if (
    datos.monto_ahorrado !== undefined &&
    (!Number.isFinite(datos.monto_ahorrado) ||
      datos.monto_ahorrado < 0 ||
      datos.monto_ahorrado > 999999999999.99)
  )
    throw new Error("El ahorro inicial debe ser cero o mayor.");
  if (datos.fecha_objetivo !== null && !fechaLocalValida(datos.fecha_objetivo))
    throw new Error("La fecha debe ser válida y tener el formato AAAA-MM-DD.");
}
// Consulta las metas del usuario actual, desde las más recientes.
// Convierte cada registro al formato MetaAhorro antes de devolver la lista.
export async function listarMetas(): Promise<MetaAhorro[]> {
  const usuario = await usuarioActual();
  const { data, error } = await supabase
    .from("metas_ahorro")
    .select(columnas)
    .eq("usuario_id", usuario)
    .order("created_at", { ascending: false });
  if (error) fallo(error);
  return (data || []).map((fila) => normalizar(fila));
}
// Valida los datos y crea una meta asociada al usuario actual.
// Utiliza cero como ahorro inicial si no se proporciona un monto.
export async function crearMeta(datos: DatosMeta): Promise<MetaAhorro> {
  validar(datos);
  const usuario = await usuarioActual();
  const { data, error } = await supabase
    .from("metas_ahorro")
    .insert({
      usuario_id: usuario,
      nombre: datos.nombre.trim(),
      monto_objetivo: datos.monto_objetivo,
      monto_ahorrado: datos.monto_ahorrado ?? 0,
      fecha_objetivo: datos.fecha_objetivo,
    })
    .select(columnas)
    .single();
  if (error) fallo(error);
  if (!data) throw new Error("No se pudo confirmar la creación de la meta.");
  return normalizar(data);
}
// Actualiza el nombre, el monto objetivo y la fecha de una meta del usuario.
// Devuelve la meta con sus datos actualizados.
export async function actualizarMeta(
  id: string,
  datos: Omit<DatosMeta, "monto_ahorrado">,
): Promise<MetaAhorro> {
  validar(datos);
  const usuario = await usuarioActual();
  const { data, error } = await supabase
    .from("metas_ahorro")
    .update({
      nombre: datos.nombre.trim(),
      monto_objetivo: datos.monto_objetivo,
      fecha_objetivo: datos.fecha_objetivo,
    })
    .eq("id", id)
    .eq("usuario_id", usuario)
    .select(columnas)
    .single();
  if (error) fallo(error);
  if (!data) throw new Error("La meta ya no está disponible.");
  return normalizar(data);
}
// Elimina una meta del usuario actual.
// Si la eliminación no devuelve registros, comprueba si la meta todavía existe.
export async function eliminarMeta(id: string): Promise<void> {
  const usuario = await usuarioActual();
  const { data, error } = await supabase
    .from("metas_ahorro")
    .delete()
    .eq("id", id)
    .eq("usuario_id", usuario)
    .select("id");
  if (error) fallo(error);
  if (!data?.length) {
    const { data: existente, error: errorConsulta } = await supabase
      .from("metas_ahorro")
      .select("id")
      .eq("id", id)
      .eq("usuario_id", usuario)
      .maybeSingle();
    if (errorConsulta) fallo(errorConsulta);
    if (existente) throw new Error("No se pudo eliminar la meta.");
  }
}
// Registra un aporte con un monto positivo o un retiro con un monto negativo.
// Ejecuta la función aportar_a_meta de Supabase y devuelve la meta actualizada.
export async function registrarAporte(
  id: string,
  monto: number,
): Promise<MetaAhorro> {
  if (
    !Number.isFinite(monto) ||
    monto === 0 ||
    Math.abs(monto) > 999999999999.99
  )
    throw new Error("Escribe un monto mayor que cero.");
  await usuarioActual();
  const { data, error } = await supabase.rpc("aportar_a_meta", {
    p_meta_id: id,
    p_monto: monto,
  });
  if (error) fallo(error);
  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila)
    throw new Error(
      "No se pudo confirmar el aporte. Actualiza la lista antes de volver a intentarlo.",
    );
  return normalizar(fila);
}