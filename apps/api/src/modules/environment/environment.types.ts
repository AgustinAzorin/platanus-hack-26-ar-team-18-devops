export interface POI {
  name: string;
  type: string;
  distance_m: number;
}

export interface TransportData {
  subte: POI[];
  tren: POI[];
  colectivo: POI[];
}

export interface EducationData {
  escuelas: POI[];
  universidades: POI[];
  jardines: POI[];
}

export interface HealthData {
  hospitales: POI[];
  clinicas: POI[];
  centros_salud: POI[];
  farmacias: POI[];
}

export interface LeisureData {
  parques: POI[];
  gastronomia: POI[];
  cines: POI[];
  gimnasios: POI[];
}

export interface EnvironmentData {
  lat: number;
  lng: number;
  transporte: TransportData;
  educacion: EducationData;
  salud: HealthData;
  ocio: LeisureData;
  error?: string;
}
