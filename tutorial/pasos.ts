export type PantallaTutorial =
  | "Inicio"
  | "Categorias"
  | "Gasto"
  | "Notificaciones"
  | "Metas"
  | "Perfil";
export type AccionTutorial =
  | "categoria_creada"
  | "gasto_creado"
  | "categorias_abiertas";
export type AccionInterfazTutorial = "crear_categoria" | "ver_gastos";
export interface PasoTutorial {
  id:
    | "inicio"
    | "categorias"
    | "gasto"
    | "resumen"
    | "gestion"
    | "notificaciones"
    | "metas"
    | "perfil";
  pantalla: PantallaTutorial;
  ruta: number;
  titulo: string;
  explicaciones: readonly string[];
  siguiente: string;
}

export const pasosTutorial: readonly PasoTutorial[] = [
  {
    id: "inicio",
    pantalla: "Inicio",
    ruta: 2,
    titulo: "Empieza creando una categoría",
    explicaciones: [
      "Las categorías organizan tus gastos: por ejemplo, Alimentación o Transporte. Las cuentas nuevas empiezan sin categorías automáticas.",
      "En Inicio las verás entre el resumen de tu dinero y Gestión de gastos. Usa Ver todas o la pestaña Categorías para administrarlas.",
      "Vamos a crear la primera desde la sección que usarás habitualmente; los botones del tutorial desaparecen al terminar la guía.",
    ],
    siguiente: "Abrir Categorías",
  },
  {
    id: "categorias",
    pantalla: "Categorias",
    ruta: 3,
    titulo: "Crea tu primera categoría",
    explicaciones: [
      "Pulsa + Nueva y elige una sugerencia, o usa Otros… para escribir tu propia categoría. Las sugerencias no se guardan hasta que las eliges.",
      "El límite indica cuánto quieres gastar en esa categoría. Se muestra una advertencia al llegar al 80 % y se considera alcanzado desde el 100 %.",
      "Puedes editar el nombre y el límite con el lápiz. La papelera pide confirmación antes de eliminar. La categoría que crees aquí se guarda en tu cuenta.",
    ],
    siguiente: "Continuar con mis categorías",
  },
  {
    id: "gasto",
    pantalla: "Gasto",
    ruta: 4,
    titulo: "Registra tus gastos",
    explicaciones: [
      "El botón + de la barra inferior abre esta pantalla. Escribe el monto con el teclado, selecciona una categoría y pulsa Registrar gasto.",
      "El registro se guarda en tu cuenta y actualiza el dinero disponible de Inicio. Otros… permite crear una categoría sin salir.",
      "No necesitas inventar un gasto para completar la guía: puedes registrar uno real o seguir sin guardar nada.",
    ],
    siguiente: "Seguir sin registrar",
  },
  {
    id: "resumen",
    pantalla: "Inicio",
    ruta: 2,
    titulo: "Entiende tu saldo y el aro",
    explicaciones: [
      "Disponible es tu sueldo configurado menos los gastos registrados. Gastado muestra el total y Sueldo la base del presupuesto; el lápiz permite cambiarla.",
      "El aro indica el porcentaje disponible: verde si queda más del 40 %, amarillo si queda más del 20 % y hasta el 40 %, rojo cuando queda el 20 % o menos.",
      "El aro se vacía al gastar y avisa si agotaste o superaste el presupuesto. El resumen cuenta los gastos registrados; todavía no se separa por mes.",
    ],
    siguiente: "Ver cómo administrar gastos",
  },
  {
    id: "gestion",
    pantalla: "Inicio",
    ruta: 2,
    titulo: "Revisa y corrige tus registros",
    explicaciones: [
      "Debajo de las categorías está Gestión de gastos. Cada fila muestra categoría, icono y monto; el lápiz permite corregirlo y la papelera pide confirmar el borrado.",
      "Desliza hacia abajo para actualizar. Las barras de cada categoría comparan lo gastado con su límite y cambian de color al acercarte o alcanzarlo.",
      "La barra inferior conserva las secciones abiertas. Puedes volver con sus botones; en Android, Atrás recorre las pantallas visitadas.",
    ],
    siguiente: "Conocer las notificaciones",
  },
  {
    id: "notificaciones",
    pantalla: "Notificaciones",
    ruta: 6,
    titulo: "Reconoce los avisos importantes",
    explicaciones: [
      "La campana de Inicio muestra cuántas alertas activas tienes. Aquí aparecen avisos por presupuesto bajo, categorías cerca de su límite y metas próximas a vencer, vencidas o completadas.",
      "Cada aviso tiene un acceso a la sección correspondiente. Los avisos se actualizan al entrar o al deslizar para refrescar; sin alertas verás Todo en orden.",
      "Son avisos dentro de FinZen. No se envían notificaciones al teléfono con la aplicación cerrada.",
    ],
    siguiente: "Conocer las metas",
  },
  {
    id: "metas",
    pantalla: "Metas",
    ruta: 5,
    titulo: "Sigue tus objetivos de ahorro",
    explicaciones: [
      "Pulsa + Nueva para definir un objetivo, su monto y una fecha opcional. El progreso compara lo ahorrado con lo que deseas alcanzar.",
      "Registrar movimiento permite anotar un aporte o retiro. Son registros manuales: no transfieren dinero, no crean gastos ni descuentan el sueldo automáticamente.",
      "Las metas quedan guardadas en tu cuenta. Puedes editarlas o eliminarlas, y no hace falta crear una ahora para seguir con la guía.",
    ],
    siguiente: "Conocer mi perfil",
  },
  {
    id: "perfil",
    pantalla: "Perfil",
    ruta: 8,
    titulo: "Tu cuenta y los últimos controles",
    explicaciones: [
      "En Editar puedes actualizar tu nombre, sueldo y día de pago. El día de pago es un dato de configuración; no crea ingresos automáticamente.",
      "Desde Perfil puedes abrir Notificaciones, consultar Gastos fijos y repetir esta guía. Gastos fijos todavía muestra ejemplos, no cobros automáticos.",
      "Cerrar sesión pide confirmación. Los datos pertenecen a cada cuenta y se conservan en la nube. Ya puedes usar FinZen con tus propios registros.",
    ],
    siguiente: "Terminar tutorial",
  },
];

export function indiceSeguroTutorial(valor: unknown): number {
  return typeof valor === "number" && Number.isInteger(valor)
    ? Math.min(pasosTutorial.length - 1, Math.max(0, valor))
    : 0;
}
