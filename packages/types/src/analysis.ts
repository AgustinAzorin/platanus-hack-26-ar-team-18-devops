import { z } from 'zod';

export const CostoTotalEstimadoSchema = z.object({
  alquiler: z.number(),
  expensas: z.number(),
  abl_estimado: z.number(),
  servicios_estimados: z.number(),
  total_mensual: z.number(),
});

export const InmuebleSchema = z.object({
  estado_y_calidad: z.string(),
  equipamiento: z.string(),
  costo_total_estimado: CostoTotalEstimadoSchema,
  red_flags: z.array(z.string()),
});

export const EntornoSchema = z.object({
  seguridad: z.string(),
  transporte: z.string(),
  educacion: z.string(),
  salud: z.string(),
  ocio: z.string(),
});

export const AnalysisReportSchema = z.object({
  score: z.number(),
  score_justificacion: z.string(),
  resumen_ejecutivo: z.string(),
  inmueble: InmuebleSchema,
  entorno: EntornoSchema,
  preguntas_inmobiliaria: z.array(z.string()),
  veredicto: z.string(),
});

export const AnalyzePropertyRequestSchema = z.object({
  url: z.string().url(),
});

export const AnalyzePropertyResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  cached: z.boolean(),
  created_at: z.string(),
  report: AnalysisReportSchema,
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type AnalyzePropertyRequest = z.infer<typeof AnalyzePropertyRequestSchema>;
export type AnalyzePropertyResponse = z.infer<typeof AnalyzePropertyResponseSchema>;
