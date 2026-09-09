export class Elemento {
  id: string;
  titulo: string;
  detalle: string;
  imagenUrl: string;

  constructor(id: string, titulo: string, detalle: string, imagenUrl: string) {
    this.id = id;
    this.titulo = titulo;
    this.detalle = detalle;
    this.imagenUrl = imagenUrl;
  }
}

export const listaElementosInicial: Elemento[] = [
  new Elemento(
    "1",
    "Sobre nosotros",
    "Transformando la relación con el dinero hacia un estado de claridad y equilibrio.\n\n" +
    "Quiénes somos:\n" +
    "FinZen nace con el propósito de simplificar el control financiero de las personas a través de la tecnología y el diseño intuitivo. Creemos que la salud financiera no se trata solo de números, sino de reducir el estrés cotidiano y permitir tomar decisiones informadas sobre el futuro.\n\n" +
    "Pilares fundamentales:\n" +
    "• Claridad sin fricción: Automatizamos el registro y la categorización para que entender tus finanzas tome minutos, no horas.\n\n" +
    "• Educación y acompañamiento: Brindamos métricas y proyecciones visuales para que cada usuario aprenda a optimizar sus ahorros.\n\n" +
    "• Transparencia total: Sin costos ocultos ni algoritmos invasivos; tú mantienes el control total de tu información.",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
  ),
  new Elemento(
    "2",
    "FinZen (La Aplicación)",
    "Gestión de presupuestos, metas de ahorro e inversión en un solo lugar.\n\n" +
    "Características principales:\n" +
    "• Monitoreo de ingresos y gastos: Gráficos dinámicos e intuitivos que desglosan tus flujos de caja por categoría en tiempo real.\n\n" +
    "• Metas de ahorro personalizadas: Configura objetivos a corto y mediano plazo con recordatorios y reglas de ahorro automático.\n\n" +
    "• Proyecciones mensuales: Visualiza estimaciones de flujo de caja para evitar sobregiros y planificar compras importantes con anticipación.\n\n" +
    "• Reportes descargables: Exporta tus balances mensuales en formatos estándar (PDF/CSV) para un seguimiento detallado.",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80"
  ),
  new Elemento(
    "3",
    "Términos y condiciones",
    "Compromiso de seguridad y directrices de uso responsable.\n\n" +
    "Puntos clave:\n" +
    "• Privacidad de datos: Tu información personal y registros contables están encriptados de punto a punto y nunca serán compartidos ni comercializados a terceros.\n\n" +
    "• Naturaleza del servicio: FinZen proporciona herramientas de monitoreo, cálculo y proyección financiera con fines puramente analíticos y educativos; no constituye asesoría de inversión formal ni corretaje de valores.\n\n" +
    "• Responsabilidad de la cuenta: El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de verificar la exactitud de los montos ingresados manualmente o sincronizados.\n\n" +
    "• Modificaciones del servicio: FinZen se reserva el derecho de actualizar funcionalidades, políticas de seguridad y términos de uso informando oportunamente.",
    "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
  ),
];