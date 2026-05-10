import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import type { AnalysisReport } from '@repo/types';

import { createServiceClient } from '../../../../../lib/supabase/service';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface AnalysisResult {
  summary: string;
  answered: { question: string; answer: string }[];
  unanswered: string[];
  verdict: 'positivo' | 'neutro' | 'negativo';
  next_step: string;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const supabase = createServiceClient();

  const { data: chat } = await supabase
    .from('chats')
    .select('id, phone_e164, propiedad_posting_id')
    .eq('id', chatId)
    .maybeSingle();

  if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });

  const { data: messages } = await supabase
    .from('messages')
    .select('direction, body, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (!messages?.length) return NextResponse.json({ error: 'Sin mensajes' }, { status: 400 });

  // Fetch property context if available
  let propertyContext = '';
  if (chat.propiedad_posting_id) {
    const { data: analysis } = await supabase
      .from('analyses')
      .select('report')
      .eq('posting_id', chat.propiedad_posting_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysis) {
      const report = analysis.report as AnalysisReport;
      propertyContext = `\nContexto de la propiedad analizada:
- Score: ${report.score}/10
- Veredicto previo: ${report.veredicto}
- Preguntas que se le hicieron al oferente: ${(report.preguntas_inmobiliaria ?? []).join(' | ')}`;
    }
  }

  const transcript = messages
    .map((m) => `[${m.direction === 'out' ? 'Bot' : 'Oferente'}]: ${m.body ?? ''}`)
    .join('\n');

  const prompt = `Sos un asistente inmobiliario analizando la respuesta de un oferente de propiedad.
${propertyContext}

Conversación completa:
${transcript}

Analizá las respuestas del oferente y respondé en JSON con esta estructura exacta:
{
  "summary": "resumen breve de cómo respondió el oferente (1-2 oraciones)",
  "answered": [{"question": "pregunta resumida", "answer": "respuesta resumida"}],
  "unanswered": ["pregunta que no respondió", ...],
  "verdict": "positivo" | "neutro" | "negativo",
  "next_step": "qué hacer ahora (ej: pedir turno de visita, esperar más info, descartar)"
}

Si el oferente respondió cosas muy vagas, cortas o evasivas, marcalas como no respondidas.
Respondé SOLO con el JSON, sin texto adicional.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';

  let result: AnalysisResult;
  try {
    result = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
  } catch {
    return NextResponse.json({ error: 'Error al parsear respuesta IA' }, { status: 500 });
  }

  return NextResponse.json(result);
}
