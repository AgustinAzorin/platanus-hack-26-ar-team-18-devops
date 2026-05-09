import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VoyageClient {
  private readonly logger = new Logger(VoyageClient.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.voyageai.com/v1/embeddings';
  private readonly model = 'voyage-3';
  private readonly timeout = 15000;

  constructor() {
    this.apiKey = process.env.VOYAGE_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('VOYAGE_API_KEY not set - embedding functionality will fail');
    }
  }

  async embed(
    text: string,
    inputType: 'document' | 'query' = 'document',
    maxRetries = 2,
  ): Promise<number[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            input: [text],
            model: this.model,
            input_type: inputType,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
          const error = await response.text();

          // Rate limit - retry with exponential backoff
          if (response.status === 429 && attempt < maxRetries) {
            const waitMs = Math.pow(2, attempt) * 1000;
            this.logger.warn(
              `Voyage API rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`,
            );
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }

          throw new Error(
            `Voyage API error ${response.status}: ${error}`,
          );
        }

        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;

        if (!Array.isArray(embedding)) {
          throw new Error('Invalid embedding response from Voyage API');
        }

        return embedding;
      } catch (error) {
        lastError = error;

        // Timeout or abort - retry with backoff
        if (
          error instanceof Error &&
          (error.name === 'AbortError' || error.message.includes('signal')) &&
          attempt < maxRetries
        ) {
          const waitMs = Math.pow(2, attempt) * 1000;
          this.logger.warn(
            `Voyage API timeout, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        // Other errors - don't retry, fail fast
        if (attempt === maxRetries) {
          this.logger.error(`Voyage embed failed after ${maxRetries + 1} attempts`, error);
          throw lastError || error;
        }
      }
    }

    throw lastError || new Error('Voyage embed failed');
  }
}
