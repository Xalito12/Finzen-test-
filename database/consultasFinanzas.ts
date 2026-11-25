// Importa la conexión con Supabase.
import { supabase } from "./supabase";

// Define los datos utilizados para representar un gasto.
export interface GastoResumen {
  id: number | string;
  monto: number | string;
  categoria: string;
  icono: string | null;
}
// Define los datos utilizados para representar una categoría.
export interface CategoriaResumen {
  id: number | string;
  nombre: string;
  icono: string | null;
  limite: number | string;
  color: string | null;
}

// Calcula el total general de gastos y el total de cada categoría.
export function resumirGastos(
  // Recibe una lista de gastos con sus campos monto y categoría.
  gastos: ReadonlyArray<Pick<GastoResumen, "monto" | "categoria">>,
) {
  // Acumula el monto total de los gastos.
  let total = 0;
  // Relaciona cada nombre de categoría con su total gastado.
  const porCategoria = new Map<string, number>();
  for (const gasto of gastos) {
    // Convierte el monto a número.
    const monto = Number(gasto.monto);
    // Omite el gasto si su monto no es un número finito.
    if (!Number.isFinite(monto)) continue;
    // Suma el monto al total general.
    total += monto;
    // Acumula el monto en la categoría correspondiente.
    porCategoria.set(
      gasto.categoria,
      (porCategoria.get(gasto.categoria) || 0) + monto,
    );
  }
  // Compatibilidad con registros antiguos llamados Comida.
  // Al consultar Alimentación, también incluye los gastos llamados Comida.
  const gastoCategoria = (nombre: string) =>
    (porCategoria.get(nombre) || 0) +
    (nombre === "Alimentación" ? porCategoria.get("Comida") || 0 : 0);
  // Devuelve el total general y la función para consultar cada categoría.
  return { total, gastoCategoria };
}

// Obtiene el usuario de la sesión actual.
async function usuarioActual() {
  // La sesión local evita validar el usuario por red en cada lectura.
  // Supabase sigue autorizando cada consulta con su token y sus políticas.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  // Propaga cualquier error al obtener la sesión.
  if (error) throw error;
  // Informa que se necesita una sesión activa para continuar.
  if (!session?.user) throw new Error("No hay una sesión activa.");
  // Devuelve los datos del usuario de la sesión.
  return session.user;
}

// Obtiene la información necesaria para la pantalla de Inicio.
export async function consultarInicio() {
  // Obtiene el usuario cuyos datos se consultarán.
  const user = await usuarioActual();
  // Ejecuta las consultas de perfil, gastos y categorías en paralelo.
  const [perfil, gastos, categorias] = await Promise.all([
    // Consulta el nombre y el sueldo del perfil del usuario.
    supabase
      .from("perfiles")
      .select("nombre, sueldo")
      .eq("id", user.id)
      .single(),
    // Consulta sus gastos ordenados de mayor a menor identificador.
    supabase
      .from("gastos")
      .select("id, monto, categoria, icono")
      .eq("usuario_id", user.id)
      .order("id", { ascending: false }),
    // Consulta sus categorías ordenadas de menor a mayor identificador.
    supabase
      .from("categorias")
      .select("id, nombre, icono, limite, color")
      .eq("usuario_id", user.id)
      .order("id", { ascending: true }),
  ]);
  // Comprueba si alguna consulta devolvió un error y lo propaga.
  if (perfil.error) throw perfil.error;
  if (gastos.error) throw gastos.error;
  if (categorias.error) throw categorias.error;
  // Devuelve los resultados agrupados.
  // Para gastos y categorías utiliza una lista vacía si no hay datos.
  return {
    user,
    perfil: perfil.data,
    gastos: (gastos.data || []) as GastoResumen[],
    categorias: (categorias.data || []) as CategoriaResumen[],
  };
}

// Obtiene las categorías y los gastos necesarios para calcular sus totales.
export async function consultarCategorias() {
  // Obtiene el usuario cuyos datos se consultarán.
  const user = await usuarioActual();
  // Ejecuta las consultas de categorías y gastos en paralelo.
  const [categorias, gastos] = await Promise.all([
    // Consulta las categorías del usuario ordenadas por identificador.
    supabase
      .from("categorias")
      .select("id, nombre, icono, limite, color")
      .eq("usuario_id", user.id)
      .order("id", { ascending: true }),
    // Consulta el monto y la categoría de cada gasto del usuario.
    supabase
      .from("gastos")
      .select("monto, categoria")
      .eq("usuario_id", user.id),
  ]);
  // Propaga cualquier error recibido en las consultas.
  if (categorias.error) throw categorias.error;
  if (gastos.error) throw gastos.error;
  // Devuelve ambas listas con los tipos de datos esperados.
  return {
    categorias: (categorias.data || []) as CategoriaResumen[],
    gastos: (gastos.data || []) as Pick<GastoResumen, "monto" | "categoria">[],
  };
}
