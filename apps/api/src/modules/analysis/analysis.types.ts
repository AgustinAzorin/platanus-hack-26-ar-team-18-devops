export interface CostoTotalEstimado {
  alquiler: number;
  expensas: number;
  abl_estimado: number;
  servicios_estimados: number;
  total_mensual: number;
}

export interface Inmueble {
  estado_y_calidad: string;
  equipamiento: string;
  costo_total_estimado: CostoTotalEstimado;
  red_flags: string[];
}

export interface Entorno {
  seguridad: string;
  transporte: string;
  educacion: string;
  salud: string;
  ocio: string;
}

export interface AnalysisReport {
  score: number;
  score_justificacion: string;
  resumen_ejecutivo: string;
  inmueble: Inmueble;
  entorno: Entorno;
  preguntas_inmobiliaria: string[];
  veredicto: string;
}

export interface AnalyzePropertyResponse {
  id: string;
  url: string;
  cached: boolean;
  created_at: string;
  report: AnalysisReport;
}
