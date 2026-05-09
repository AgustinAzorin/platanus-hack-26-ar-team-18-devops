export const SYSTEM_PROMPT = `...REPLACE_ME_WITH_REAL_SYSTEM_PROMPT...`;

export function buildUserPrompt(scrapedData: unknown, url: string): string {
  return [
    `URL de la publicación: ${url}`,
    '',
    'Datos scrapeados de la publicación (JSON):',
    '```json',
    JSON.stringify(scrapedData, null, 2),
    '```',
    '',
    'Generá el informe de due diligence respetando ESTRICTAMENTE el formato JSON definido en el system prompt. Devolvé SOLO el JSON, sin texto adicional, sin backticks, sin prefijos.',
  ].join('\n');
}
