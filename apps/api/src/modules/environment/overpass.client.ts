import { Injectable, Logger } from '@nestjs/common';

import type { EnvironmentData, LeisureData, HealthData, EducationData, TransportData, POI } from './environment.types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'PropertyAnalyzer-Hackathon/1.0';
const RADIUS_M = 1000;
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const MAX_DEFAULT = 10;
const MAX_GASTRO = 20;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildQuery(lat: number, lng: number): string {
  const ar = `around:${RADIUS_M},${lat},${lng}`;
  return `
[out:json][timeout:30];
(
  node["railway"="station"](${ar});
  node["highway"="bus_stop"](${ar});
  node["amenity"~"^(school|university|kindergarten|hospital|clinic|doctors|pharmacy|restaurant|bar|cafe|cinema)$"](${ar});
  way["amenity"~"^(school|university|hospital)$"](${ar});
  node["leisure"~"^(park|fitness_centre)$"](${ar});
  way["leisure"="park"](${ar});
);
out center;
  `.trim();
}

function elementCoords(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function poiName(el: OverpassElement, fallback: string): string {
  return el.tags?.name ?? fallback;
}

function top(arr: POI[], limit: number): POI[] {
  return arr.sort((a, b) => a.distance_m - b.distance_m).slice(0, limit);
}

function classifyElements(
  elements: OverpassElement[],
  propLat: number,
  propLng: number,
): {
  transporte: TransportData;
  educacion: EducationData;
  salud: HealthData;
  ocio: LeisureData;
} {
  const transport: TransportData = { subte: [], tren: [], colectivo: [] };
  const edu: EducationData = { escuelas: [], universidades: [], jardines: [] };
  const health: HealthData = { hospitales: [], clinicas: [], centros_salud: [], farmacias: [] };
  const leisure: LeisureData = { parques: [], gastronomia: [], cines: [], gimnasios: [] };

  for (const el of elements) {
    const coords = elementCoords(el);
    if (!coords) continue;
    const tags = el.tags ?? {};
    const dist = haversine(propLat, propLng, coords.lat, coords.lng);

    if (tags.railway === 'station') {
      if (tags.station === 'subway') {
        const line = tags.line ?? tags.ref ?? '';
        transport.subte.push({ name: poiName(el, 'Estación de subte'), type: line ? `Línea ${line}` : 'subte', distance_m: dist });
      } else {
        transport.tren.push({ name: poiName(el, 'Estación de tren'), type: tags.operator ?? 'tren', distance_m: dist });
      }
      continue;
    }

    if (tags.highway === 'bus_stop') {
      transport.colectivo.push({ name: poiName(el, 'Parada de colectivo'), type: 'colectivo', distance_m: dist });
      continue;
    }

    if (tags.amenity === 'school') {
      edu.escuelas.push({ name: poiName(el, 'Escuela'), type: 'escuela', distance_m: dist });
    } else if (tags.amenity === 'university') {
      edu.universidades.push({ name: poiName(el, 'Universidad'), type: 'universidad', distance_m: dist });
    } else if (tags.amenity === 'kindergarten') {
      edu.jardines.push({ name: poiName(el, 'Jardín de infantes'), type: 'jardín', distance_m: dist });
    } else if (tags.amenity === 'hospital') {
      health.hospitales.push({ name: poiName(el, 'Hospital'), type: 'hospital', distance_m: dist });
    } else if (tags.amenity === 'clinic') {
      health.clinicas.push({ name: poiName(el, 'Clínica'), type: 'clínica', distance_m: dist });
    } else if (tags.amenity === 'doctors') {
      health.centros_salud.push({ name: poiName(el, 'Centro de salud'), type: 'centro de salud', distance_m: dist });
    } else if (tags.amenity === 'pharmacy') {
      health.farmacias.push({ name: poiName(el, 'Farmacia'), type: 'farmacia', distance_m: dist });
    } else if (tags.amenity === 'restaurant' || tags.amenity === 'bar' || tags.amenity === 'cafe') {
      leisure.gastronomia.push({ name: poiName(el, tags.amenity), type: tags.amenity, distance_m: dist });
    } else if (tags.amenity === 'cinema') {
      leisure.cines.push({ name: poiName(el, 'Cine'), type: 'cine', distance_m: dist });
    } else if (tags.leisure === 'park') {
      leisure.parques.push({ name: poiName(el, 'Parque'), type: 'parque', distance_m: dist });
    } else if (tags.leisure === 'fitness_centre') {
      leisure.gimnasios.push({ name: poiName(el, 'Gimnasio'), type: 'gimnasio', distance_m: dist });
    }
  }

  return {
    transporte: {
      subte: top(transport.subte, MAX_DEFAULT),
      tren: top(transport.tren, MAX_DEFAULT),
      colectivo: top(transport.colectivo, MAX_DEFAULT),
    },
    educacion: {
      escuelas: top(edu.escuelas, MAX_DEFAULT),
      universidades: top(edu.universidades, MAX_DEFAULT),
      jardines: top(edu.jardines, MAX_DEFAULT),
    },
    salud: {
      hospitales: top(health.hospitales, MAX_DEFAULT),
      clinicas: top(health.clinicas, MAX_DEFAULT),
      centros_salud: top(health.centros_salud, MAX_DEFAULT),
      farmacias: top(health.farmacias, MAX_DEFAULT),
    },
    ocio: {
      parques: top(leisure.parques, MAX_DEFAULT),
      gastronomia: top(leisure.gastronomia, MAX_GASTRO),
      cines: top(leisure.cines, MAX_DEFAULT),
      gimnasios: top(leisure.gimnasios, MAX_DEFAULT),
    },
  };
}

@Injectable()
export class OverpassClient {
  private readonly logger = new Logger(OverpassClient.name);

  async fetchPOIs(
    lat: number,
    lng: number,
  ): Promise<Pick<EnvironmentData, 'transporte' | 'educacion' | 'salud' | 'ocio'>> {
    const query = buildQuery(lat, lng);
    const body = `data=${encodeURIComponent(query)}`;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let res: Response;
        try {
          res = await fetch(OVERPASS_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': USER_AGENT,
            },
            body,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`Overpass HTTP ${res.status}`);
          continue;
        }
        if (!res.ok) {
          throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
        }

        const data = (await res.json()) as OverpassResponse;
        return classifyElements(data.elements ?? [], lat, lng);
      } catch (err) {
        lastError = err as Error;
        if ((err as Error).name === 'AbortError') {
          this.logger.warn(`Overpass timeout on attempt ${attempt + 1}`);
        }
      }
    }

    throw lastError ?? new Error('Overpass failed after retries');
  }
}
