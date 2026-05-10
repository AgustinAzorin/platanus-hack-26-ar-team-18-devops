import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

import type { AnalysisReport } from '@repo/types';

import type { Env } from '../../config/env.schema';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts/analysis.prompt';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;
const TIMEOUT_MS = 180_000;
const MAX_RETRIES = 5;
// Cap photos sent as image blocks. Anthropic accepts up to 100 images per
// request; 50 covers typical zonaprop publications (often 30+ photos) with
// headroom. Latency is not a concern here per product decision.
const MAX_PHOTOS = 50;

@Injectable()
export class ClaudeClient {
  private readonly logger = new Logger(ClaudeClient.name);
  private readonly client: Anthropic;

  constructor(config: ConfigService<Env, true>) {
    const apiKey = config.get('ANTHROPIC_API_KEY', { infer: true });
    this.client = new Anthropic({
      apiKey,
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }

  async analyzeProperty(
    scrapedData: unknown,
    url: string,
    imageUrls: string[],
    environmentNarrative?: string,
  ): Promise<AnalysisReport> {
    const photos = imageUrls
      .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u))
      .slice(0, MAX_PHOTOS);
    const userPrompt = buildUserPrompt(scrapedData, url, photos.length, environmentNarrative);

    const content: Anthropic.ContentBlockParam[] = [{ type: 'text', text: userPrompt }];
    for (const photo of photos) {
      content.push({
        type: 'image',
        source: { type: 'url', url: photo },
      });
    }

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        } satisfies Anthropic.WebSearchTool20250305,
      ],
      messages: [{ role: 'user', content }],
    });

    const cache = response.usage as unknown as {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    this.logger.log(
      `claude usage: in=${response.usage.input_tokens} out=${response.usage.output_tokens} ` +
        `cache_create=${cache.cache_creation_input_tokens ?? 0} ` +
        `cache_read=${cache.cache_read_input_tokens ?? 0} stop=${response.stop_reason}`,
    );

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!text) {
      throw new Error('Claude returned no text content');
    }

    return this.parseReport(text);
  }

  private parseReport(text: string): AnalysisReport {
    const json = extractJsonObject(text);
    if (!json) {
      throw new Error(`Claude response did not contain valid JSON: ${text.slice(0, 500)}`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      throw new Error(`Failed to parse Claude JSON: ${(err as Error).message}`);
    }
    assertReportShape(parsed);
    return parsed;
  }
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function assertReportShape(value: unknown): asserts value is AnalysisReport {
  if (!value || typeof value !== 'object') {
    throw new Error('Claude report is not an object');
  }
  const v = value as Record<string, unknown>;
  const required = [
    'score',
    'score_justificacion',
    'resumen_ejecutivo',
    'inmueble',
    'entorno',
    'preguntas_inmobiliaria',
    'veredicto',
  ];
  for (const key of required) {
    if (!(key in v)) {
      throw new Error(`Claude report missing field: ${key}`);
    }
  }
  if (typeof v.score !== 'number') {
    throw new Error('Claude report.score is not a number');
  }
}
