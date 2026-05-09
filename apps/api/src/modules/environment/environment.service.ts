import { Injectable, Logger } from '@nestjs/common';

import { EnvironmentCacheService } from './environment-cache.service';
import { NominatimClient } from './nominatim.client';
import { OverpassClient } from './overpass.client';
import type { EnvironmentData, POI } from './environment.types';

function emptyEnvironmentData(lat: number, lng: number, error: string): EnvironmentData {
  return {
    lat,
    lng,
    transporte: { subte: [], tren: [], colectivo: [] },
    educacion: { escuelas: [], universidades: [], jardines: [] },
    salud: { hospitales: [], clinicas: [], centros_salud: [], farmacias: [] },
    ocio: { parques: [], gastronomia: [], cines: [], gimnasios: [] },
    error,
  };
}

function poiLine(poi: POI): string {
  const detail = poi.type && poi.type !== poi.name ? ` (${poi.type})` : '';
  return `  - A ${poi.distance_m}m: ${poi.name}${detail}`;
}

function section(title: string, items: POI[], emptyMsg: string): string {
  if (!items.length) return `${title}: ${emptyMsg}`;
  return `${title}:\n${items.map(poiLine).join('\n')}`;
}

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  constructor(
    private readonly nominatim: NominatimClient,
    private readonly overpass: OverpassClient,
    private readonly cache: EnvironmentCacheService,
  ) {}

  async getEnvironmentData(address: string, neighborhood?: string): Promise<EnvironmentData> {
    const fullAddress = [address, neighborhood, 'Buenos Aires, Argentina']
      .filter(Boolean)
      .join(', ');

    const coords = await this.nominatim.geocode(fullAddress);
    if (!coords) {
      this.logger.warn(`geocoding failed for: ${fullAddress}`);
      return emptyEnvironmentData(0, 0, 'No se pudieron geocodificar las coordenadas de la propiedad');
    }

    const { lat, lng } = coords;

    const cached = await this.cache.get(lat, lng);
    if (cached) {
      this.logger.log(`environment cache hit for ${lat},${lng}`);
      return cached;
    }

    let pois: Pick<EnvironmentData, 'transporte' | 'educacion' | 'salud' | 'ocio'>;
    try {
      pois = await this.overpass.fetchPOIs(lat, lng);
    } catch (err) {
      this.logger.warn(`Overpass failed: ${(err as Error).message}`);
      return emptyEnvironmentData(lat, lng, `Overpass no disponible: ${(err as Error).message}`);
    }

    const result: EnvironmentData = { lat, lng, ...pois };
    await this.cache.set(lat, lng, result);
    return result;
  }

  formatForPrompt(env: EnvironmentData): string {
    if (env.error && !env.transporte.subte.length && !env.transporte.colectivo.length) {
      return `DATOS DE ENTORNO: No disponibles (${env.error})`;
    }

    const { transporte, educacion, salud, ocio } = env;

    const transportLines: string[] = [];
    if (transporte.subte.length) transportLines.push(...transporte.subte.map(poiLine));
    if (transporte.tren.length) transportLines.push(...transporte.tren.map(poiLine));
    if (transporte.colectivo.length) {
      const dists = transporte.colectivo.map((p) => `${p.distance_m}m`).join(', ');
      transportLines.push(`  - Paradas de colectivo más cercanas: ${dists}`);
    }

    const blocks = [
      'DATOS DE ENTORNO (radio 1km, fuente: OpenStreetMap)',
      '',
      'TRANSPORTE:',
      transportLines.length ? transportLines.join('\n') : '  Sin datos de transporte en el radio',
      '',
      section('EDUCACIÓN - Escuelas', educacion.escuelas, 'Sin escuelas en el radio'),
      section('EDUCACIÓN - Universidades', educacion.universidades, 'Sin universidades en el radio'),
      section('EDUCACIÓN - Jardines de infantes', educacion.jardines, 'Sin jardines en el radio'),
      '',
      section('SALUD - Hospitales', salud.hospitales, 'Sin hospitales en el radio'),
      section('SALUD - Clínicas', salud.clinicas, 'Sin clínicas en el radio'),
      section('SALUD - Centros de salud', salud.centros_salud, 'Sin centros de salud en el radio'),
      section('SALUD - Farmacias', salud.farmacias, 'Sin farmacias en el radio'),
      '',
      section('OCIO - Parques', ocio.parques, 'Sin parques en el radio'),
      ocio.gastronomia.length
        ? `OCIO - Gastronomía: ${ocio.gastronomia.length} locales en radio 1km (más cercano a ${ocio.gastronomia[0]?.distance_m}m)`
        : 'OCIO - Gastronomía: Sin datos',
      section('OCIO - Cines', ocio.cines, 'Sin cines en el radio'),
      section('OCIO - Gimnasios', ocio.gimnasios, 'Sin gimnasios en el radio'),
    ];

    if (env.error) {
      blocks.push('', `Nota: ${env.error}`);
    }

    return blocks.join('\n');
  }
}
