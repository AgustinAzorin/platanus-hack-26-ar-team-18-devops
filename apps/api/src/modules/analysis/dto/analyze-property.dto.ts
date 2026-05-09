import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SUPPORTED_HOSTS = [
  'zonaprop.com.ar',
  'www.zonaprop.com.ar',
  'mercadolibre.com.ar',
  'inmuebles.mercadolibre.com.ar',
  'argenprop.com',
  'www.argenprop.com',
];

export const AnalyzePropertySchema = z.object({
  url: z
    .string()
    .url('url must be a valid URL')
    .refine(
      (raw) => {
        try {
          const host = new URL(raw).hostname.toLowerCase();
          return SUPPORTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
        } catch {
          return false;
        }
      },
      { message: 'url must point to ZonaProp, MercadoLibre or Argenprop' },
    ),
});

export class AnalyzePropertyDto extends createZodDto(AnalyzePropertySchema) {}
