import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import type { AnalysisReport } from '@repo/types';

import { createServiceClient } from '../../../../../lib/supabase/service';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: analysis } = await supabase
    .from('analyses')
    .select('report, posting_id')
    .eq('id', id)
    .maybeSingle();

  if (!analysis) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 });

  const report = analysis.report as AnalysisReport;

  const { data: propRaw } = await supabase
    .from('propiedades')
    .select('address, neighborhood, rooms, price_value, price_type')
    .eq('posting_id', analysis.posting_id ?? '')
    .maybeSingle();

  const prop = propRaw as {
    address: string | null;
    neighborhood: string | null;
    rooms: number | null;
    price_value: number | null;
    price_type: string | null;
  } | null;

  const propDesc = prop
    ? `${prop.rooms ?? '?'} ambientes en ${prop.neighborhood ?? 'CABA'} — ${prop.price_value ? `${prop.price_type === 'USD' ? 'USD' : '$'} ${prop.price_value.toLocaleString('es-AR')}` : 'precio a consultar'}`
    : 'propiedad sin datos';

  const questions = report.preguntas_inmobiliaria ?? [];
  const redFlags = report.inmueble?.red_flags ?? [];

  const prompt = `Sos un comprador de inmuebles en Argentina. Vas a enviar un mensaje de WhatsApp al oferente o inmobiliaria de una propiedad que analizaste con IA.

Propiedad: ${propDesc}
Score del análisis: ${report.score}/10
Veredicto: ${report.veredicto}
${redFlags.length > 0 ? `Aspectos a aclarar: ${redFlags.join('; ')}` : ''}
${questions.length > 0 ? `Preguntas que querés hacer: ${questions.join(' | ')}` : ''}

Redactá un mensaje de WhatsApp en español rioplatense, informal pero cortés. Debe:
- Presentarte brevemente como interesado
- Mencionar la propiedad (barrio + ambientes)
- Hacer las preguntas más importantes de forma natural (no numeradas, fluidas)
- Ser conciso (máximo 5-6 líneas)
- No sonar a bot ni a copy-paste genérico

Respondé solo con el texto del mensaje, sin comillas ni explicaciones.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const draft = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

  return NextResponse.json({ draft });
}
