import { z } from 'zod';

// Accept number or null/missing, default to 0. Uses preprocess so the schema's
// input type stays `unknown` and the output type is cleanly `number`.
const NumberField = z.preprocess((v) => (typeof v === 'number' ? v : 0), z.number());

export const CostoTotalEstimadoSchema = z.object({
  alquiler: NumberField,
  expensas: NumberField,
  abl_estimado: NumberField,
  servicios_estimados: NumberField,
  total_mensual: NumberField,
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
  visual_description: z.string().optional(),
  inmueble: InmuebleSchema,
  entorno: EntornoSchema,
  preguntas_inmobiliaria: z.array(z.string()),
  veredicto: z.string(),
});

export const PropertyDataSchema = z.object({
  posting_id: z.string(),
  url: z.string().nullable(),
  address: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().nullable(),
  price_value: z.number().nullable(),
  price_type: z.string().nullable(),
  expenses_value: z.number().nullable(),
  expenses_type: z.string().nullable(),
  square_meters_area: z.number().nullable(),
  rooms: z.number().nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  parking: z.number().nullable(),
  description: z.string().nullable(),
  image_urls: z.array(z.string()),
});

export const AnalyzePropertyRequestSchema = z.object({
  neighborhood: z.string().min(1),
});

export const AnalyzePropertyResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  cached: z.boolean(),
  created_at: z.string(),
  report: AnalysisReportSchema,
  property: PropertyDataSchema,
});

export const NeighborhoodsResponseSchema = z.array(z.string());

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type PropertyData = z.infer<typeof PropertyDataSchema>;
export type AnalyzePropertyRequest = z.infer<typeof AnalyzePropertyRequestSchema>;
export type AnalyzePropertyResponse = z.infer<typeof AnalyzePropertyResponseSchema>;
export type NeighborhoodsResponse = z.infer<typeof NeighborhoodsResponseSchema>;
