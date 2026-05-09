import { Injectable, Logger } from '@nestjs/common';

export interface ScrapedProperty {
  url: string;
  titulo: string;
  precio: { moneda: string; valor: number };
  expensas: { moneda: string; valor: number } | null;
  direccion: string;
  barrio: string;
  ciudad: string;
  ambientes: number;
  dormitorios: number;
  banos: number;
  superficie_total_m2: number;
  superficie_cubierta_m2: number;
  antiguedad_anios: number | null;
  amenities: string[];
  descripcion: string;
  inmobiliaria: string | null;
  publicado_en: string;
}

/**
 * TEMPORARY STUB. Replace with the real scraper module once the team's
 * scraping service is ready. Keeps the analysis flow runnable end-to-end.
 */
@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  async scrapeProperty(url: string): Promise<ScrapedProperty> {
    this.logger.warn(`using STUB scraper for ${url} — replace with real impl`);
    return {
      url,
      titulo: 'Departamento 3 ambientes con balcón en Palermo',
      precio: { moneda: 'ARS', valor: 480_000 },
      expensas: { moneda: 'ARS', valor: 130_000 },
      direccion: 'Av. Santa Fe al 4500',
      barrio: 'Palermo',
      ciudad: 'CABA',
      ambientes: 3,
      dormitorios: 2,
      banos: 1,
      superficie_total_m2: 75,
      superficie_cubierta_m2: 68,
      antiguedad_anios: 25,
      amenities: ['portero 24h', 'ascensor', 'balcón'],
      descripcion:
        'Luminoso departamento de 3 ambientes a estrenar pintura, contrafrente, balcón con vista despejada. ' +
        'Living comedor amplio, cocina separada, 2 dormitorios con placards. Excelente ubicación a metros del subte D.',
      inmobiliaria: 'Inmobiliaria Demo',
      publicado_en: '2026-04-15',
    };
  }
}
