import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

import type { Env } from '../../config/env.schema';
import { TRANSLATION_SYSTEM_PROMPT } from './prompts/search-translation.prompt';
import { SUMMARY_SYSTEM_PROMPT, buildSummaryUserPrompt } from './prompts/search-summary.prompt';
import {
  SearchFiltersSchema,
  type SearchFilters,
  type MetaReport,
  type SearchResultItem,
} from './search.types';

const MODEL = 'claude-sonnet-4-6';
const TRANSLATION_MAX_TOKENS = 1024;
const SUMMARY_MAX_TOKENS = 2048;
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;

@Injectable()
export class SearchClaudeClient {
  private readonly logger = new Logger(SearchClaudeClient.name);
  private readonly client: Anthropic;

  constructor(config: ConfigService<Env, true>) {
    const apiKey = config.get('ANTHROPIC_API_KEY', { infer: true });
    this.client = new Anthropic({
      apiKey,
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }

  async translateQuery(userQuery: string): Promise<SearchFilters> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: TRANSLATION_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: TRANSLATION_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userQuery }],
    });

    this.logUsage('translate', response);
    const text = extractText(response);
    const json = extractJsonObject(text);
    if (!json) {
      throw new Error(`Translation response did not contain JSON: ${text.slice(0, 300)}`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      throw new Error(`Failed to parse translation JSON: ${(err as Error).message}`);
    }
    const validated = SearchFiltersSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(
        `Translation JSON failed schema validation: ${validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    return validated.data;
  }

  async summarize(
    query: string,
    filters: SearchFilters,
    items: SearchResultItem[],
  ): Promise<MetaReport> {
    const userPrompt = buildSummaryUserPrompt(query, filters, items);
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: SUMMARY_MAX_TOKENS,
      system: [{ type: 'text', text: SUMMARY_SYSTEM_PROMPT }],
      messages: [{ role: 'user', content: userPrompt }],
    });

    this.logUsage('summarize', response);
    const text = extractText(response);
    const json = extractJsonObject(text);
    if (!json) {
      throw new Error(`Summary response did not contain JSON: ${text.slice(0, 300)}`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      throw new Error(`Failed to parse summary JSON: ${(err as Error).message}`);
    }
    assertMetaReportShape(parsed);
    return parsed;
  }

  private logUsage(label: string, response: Anthropic.Message): void {
    const cache = response.usage as unknown as {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    this.logger.log(
      `claude ${label}: in=${response.usage.input_tokens} out=${response.usage.output_tokens} ` +
        `cache_create=${cache.cache_creation_input_tokens ?? 0} ` +
        `cache_read=${cache.cache_read_input_tokens ?? 0} stop=${response.stop_reason}`,
    );
  }
}

function extractText(response: Anthropic.Message): string {
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  if (!text) {
    throw new Error('Claude returned no text content');
  }
  return text;
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

function assertMetaReportShape(value: unknown): asserts value is MetaReport {
  if (!value || typeof value !== 'object') {
    throw new Error('Meta report is not an object');
  }
  const v = value as Record<string, unknown>;
  for (const key of ['resumen_busqueda', 'top_recomendaciones', 'trade_offs', 'alertas']) {
    if (!(key in v)) {
      throw new Error(`Meta report missing field: ${key}`);
    }
  }
  if (typeof v.resumen_busqueda !== 'string') {
    throw new Error('Meta report.resumen_busqueda is not a string');
  }
  if (!Array.isArray(v.top_recomendaciones)) {
    throw new Error('Meta report.top_recomendaciones is not an array');
  }
  if (!Array.isArray(v.trade_offs) || !Array.isArray(v.alertas)) {
    throw new Error('Meta report.trade_offs/alertas must be arrays');
  }
}
