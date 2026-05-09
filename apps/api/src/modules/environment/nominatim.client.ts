import { Injectable, Logger } from '@nestjs/common';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'PropertyAnalyzer-Hackathon/1.0';
const MIN_INTERVAL_MS = 1_100;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable()
export class NominatimClient {
  private readonly logger = new Logger(NominatimClient.name);
  private lastCallAt = 0;

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    await this.rateLimit();

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'ar',
    });

    const url = `${NOMINATIM_URL}?${params.toString()}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      this.logger.warn(`Nominatim request failed: ${(err as Error).message}`);
      return null;
    }

    if (!res.ok) {
      this.logger.warn(`Nominatim HTTP ${res.status}`);
      return null;
    }

    const results = (await res.json()) as NominatimResult[];
    if (!results.length) {
      this.logger.warn(`Nominatim returned no results for: ${address}`);
      return null;
    }

    const { lat, lon } = results[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  }

  private async rateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastCallAt;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
    }
    this.lastCallAt = Date.now();
  }
}
