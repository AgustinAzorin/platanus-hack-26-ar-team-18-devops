import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisReport } from '@repo/types';
import { NextResponse } from 'next/server';

import { sendText } from '../../../../../lib/kapso/client';
import { kapsoEnv } from '../../../../../lib/kapso/env';
import { sendOutbound } from '../../../../../lib/kapso/messaging';
import { createServiceClient } from '../../../../../lib/supabase/service';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Per-instance mutex: prevents duplicate replies when the same event fires twice.
const inFlight = new Set<string>();

// Chats where the bot proposed a specific visit date — stops further auto-replies.
// In-memory (resets on restart); the DB scan below provides restart resilience.
const meetingProposedChats = new Set<string>();

const CONCRETE_VISIT_PROPOSAL_PATTERN =
  /\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|hoy|mañana)\b[\s\S]*\b(?:a\s+las\s+\d{1,2}(?::\d{2})?|\d{1,2}:\d{2}\s*(?:hs?\.?|h)?|\d{1,2}\s*(?:hs?\.?|h))\b/i;
const AGENDA_MARKER_PATTERN = /\[AGENDAR(?::([^\]]+))?\]/i;
const CALENDAR_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const DEFAULT_VISIT_DURATION_MINUTES = 30;

interface PropertyInfo {
  label: string;
  location: string;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;

  if (inFlight.has(chatId)) {
    return NextResponse.json({ skipped: true, reason: 'ya en proceso' });
  }
  inFlight.add(chatId);

  try {
    return await handleReply(chatId);
  } finally {
    inFlight.delete(chatId);
  }
}

async function handleReply(chatId: string) {
  const supabase = createServiceClient();

  const { data: chat } = await supabase
    .from('chats')
    .select('id, phone_e164, propiedad_posting_id, last_inbound_at')
    .eq('id', chatId)
    .maybeSingle();

  if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });

  const { data: messages } = await supabase
    .from('messages')
    .select('id, direction, body, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (!messages?.length) return NextResponse.json({ error: 'Sin mensajes' }, { status: 400 });

  // Stop if a visit was already proposed in this chat (in-memory check).
  if (meetingProposedChats.has(chatId)) {
    return NextResponse.json({ skipped: true, reason: 'reunión ya propuesta' });
  }
  // Restart resilience: scan prior outbound messages for visit-proposal signals.
  const outboundBodies = messages.filter((m) => m.direction === 'out').map((m) => m.body ?? '');
  const visitAlreadyProposed = outboundBodies.some(
    (b) => b.includes('[AGENDADO]') || (/visita/i.test(b) && CONCRETE_VISIT_PROPOSAL_PATTERN.test(b)),
  );
  if (visitAlreadyProposed) {
    meetingProposedChats.add(chatId);
    return NextResponse.json({ skipped: true, reason: 'reunión ya propuesta' });
  }

  // Only reply if the last message is inbound (avoid replying to our own messages)
  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.direction !== 'in') {
    return NextResponse.json({ skipped: true, reason: 'último mensaje es outbound' });
  }

  // Guard: skip if we already replied to the current last inbound.
  // Check for any outbound sent AFTER the last inbound message — the real semantic check.
  // This correctly handles the case where the seller replied quickly to our previous message.
  const lastInMsg = messages.filter((m) => m.direction === 'in').pop()!;
  const { data: alreadyReplied } = await supabase
    .from('messages')
    .select('id')
    .eq('chat_id', chatId)
    .eq('direction', 'out')
    .gt('created_at', lastInMsg.created_at)
    .limit(1)
    .maybeSingle();

  if (alreadyReplied) {
    return NextResponse.json({ skipped: true, reason: 'ya respondido a este mensaje' });
  }

  // Skip bot reply if 24h customer service window is closed — we can't send free text
  // and sending a template would deliver a generic opener instead of the intended reply.
  const WINDOW_MS = 24 * 60 * 60 * 1000;
  const lastInbound = chat.last_inbound_at ? new Date(chat.last_inbound_at).getTime() : null;
  if (!lastInbound || Date.now() - lastInbound > WINDOW_MS) {
    console.log('[ai-reply]', 'skipping: 24h window closed', { chatId });
    return NextResponse.json({ skipped: true, reason: 'ventana de 24h cerrada' });
  }

  // Build property context
  let propertyContext = '';
  let preguntas: string[] = [];
  let propertyInfo: PropertyInfo | null = null;
  if (chat.propiedad_posting_id) {
    const { data: prop } = await supabase
      .from('propiedades')
      .select('address, neighborhood, rooms, price_value, price_type')
      .eq('posting_id', chat.propiedad_posting_id)
      .maybeSingle();

    const { data: analysis } = await supabase
      .from('analyses')
      .select('report')
      .eq('posting_id', chat.propiedad_posting_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prop) {
      const p = prop as { address: string | null; neighborhood: string | null; rooms: number | null; price_value: number | null; price_type: string | null };
      const price = p.price_value ? `${p.price_type === 'USD' ? 'USD' : '$'} ${p.price_value.toLocaleString('es-AR')}` : 'precio a consultar';
      const neighborhood = p.neighborhood ?? 'CABA';
      propertyInfo = {
        label: `${p.rooms ?? '?'} ambientes en ${neighborhood} - ${price}`,
        location: [p.address, p.neighborhood].filter(Boolean).join(', '),
      };
      propertyContext = `Propiedad: ${propertyInfo.label}`;
    }
    if (analysis) {
      const report = analysis.report as AnalysisReport;
      preguntas = report.preguntas_inmobiliaria ?? [];
      propertyContext += `\nScore del informe IA: ${report.score}/10\nVeredicto: ${report.veredicto}`;
    }
  }

  const transcript = messages
    .map((m) => `[${m.direction === 'out' ? 'Nosotros' : 'Oferente'}]: ${m.body ?? ''}`)
    .join('\n');

  const prompt = `Sos el asistente de Casita, gestionando la comunicación con el oferente de una propiedad en nombre de un interesado en alquilarla.

${propertyContext ? propertyContext + '\n' : ''}${preguntas.length ? `Preguntas que hicimos: ${preguntas.join(' | ')}\n` : ''}
Conversación hasta ahora:
${transcript}

Hoy es ${formatPromptDate(new Date())}. Zona horaria: Buenos Aires (${CALENDAR_TIME_ZONE}).

Tu objetivo es responder el último mensaje del oferente de forma natural y cordial, y avanzar progresivamente hacia agendar una visita presencial. Seguí esta estrategia:
- Si el oferente respondió preguntas: agradecé brevemente, hacé 1-2 preguntas de seguimiento sobre lo más relevante, y empezá a mencionar la posibilidad de visitar
- Si el oferente fue vago o no respondió: reformulá de forma más directa y amigable, y propendé a una visita
- Si ya hay buena relación establecida: proponé un día y horario CONCRETO para la visita (ej: "¿Te viene bien el martes a las 18hs?")
- Siempre: tono rioplatense, informal pero respetuoso, mensajes cortos (máximo 4-5 líneas)
- NO uses listas numeradas en este mensaje — hablá de forma conversacional

IMPORTANTE: Si en este mensaje proponés un día y horario concreto para la visita, agregá al final del mensaje un marcador interno con este formato exacto: "[AGENDAR:YYYY-MM-DDTHH:mm]". La fecha y hora deben ser la propuesta concreta en horario de Buenos Aires. No expliques ni menciones el marcador.

Respondé SOLO con el texto del mensaje (más el marcador [AGENDAR:YYYY-MM-DDTHH:mm] si aplica), sin comillas ni otras explicaciones.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawReply = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  if (!rawReply) return NextResponse.json({ error: 'Respuesta vacía de IA' }, { status: 500 });

  const agendaMatch = rawReply.match(AGENDA_MARKER_PATTERN);
  const meetingProposed = Boolean(agendaMatch);
  const appointmentStart = parseAgendaStart(agendaMatch?.[1]);
  // Strip the marker before sending — it's internal only.
  const replyText = rawReply.replace(/\[AGENDAR(?::[^\]]+)?\]/gi, '').trim();

  if (meetingProposed) {
    meetingProposedChats.add(chatId);
    console.log('[ai-reply]', 'visita propuesta — bot se detiene', { chatId, appointmentStart });
  }

  const calendarUrl = appointmentStart
    ? buildMeetingCalendarUrl({
        appointmentStart,
        chatPhone: chat.phone_e164,
        propertyInfo,
        replyText,
      })
    : null;

  // Send the message via WhatsApp
  const sent = await sendOutbound(chat, replyText);
  const webCalendarMessage = calendarUrl && appointmentStart
    ? await persistCalendarLinkMessage({
        chatId,
        calendarUrl,
        propertyInfo,
        replyText,
        appointmentStart,
      })
    : null;
  const ownerNotification = meetingProposed
    ? await notifyOwnerOfMeetingProposal({
        chatPhone: chat.phone_e164,
        propertyInfo,
        replyText,
        appointmentStart,
        calendarUrl,
      })
    : null;

  return NextResponse.json({ sent, reply: replyText, meetingProposed, calendarUrl, webCalendarMessage, ownerNotification });
}

function formatPromptDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: CALENDAR_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function parseAgendaStart(value: string | undefined): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  // Store the proposed Buenos Aires wall-clock time in UTC components so
  // formatting below is independent from the server timezone.
  const parsed = new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  ));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildGoogleCalendarUrl(input: {
  start: Date;
  title: string;
  details: string;
  location: string;
}): string {
  const end = new Date(input.start.getTime() + DEFAULT_VISIT_DURATION_MINUTES * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${formatCalendarDate(input.start)}/${formatCalendarDate(end)}`,
    details: input.details,
    location: input.location,
    ctz: CALENDAR_TIME_ZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildMeetingCalendarUrl(input: {
  appointmentStart: Date;
  chatPhone: string;
  propertyInfo: PropertyInfo | null;
  replyText: string;
}): string {
  return buildGoogleCalendarUrl({
    start: input.appointmentStart,
    title: `Visita ${input.propertyInfo?.label ?? 'propiedad'}`,
    details: [
      'Visita propuesta por Casita IA.',
      `Oferente: ${input.chatPhone}`,
      '',
      `Mensaje enviado: ${input.replyText}`,
    ].join('\n'),
    location: input.propertyInfo?.location ?? '',
  });
}

function formatCalendarDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    'T',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    '00',
  ].join('');
}

async function notifyOwnerOfMeetingProposal(input: {
  chatPhone: string;
  propertyInfo: PropertyInfo | null;
  replyText: string;
  appointmentStart: Date | null;
  calendarUrl: string | null;
}): Promise<{ sent: boolean; calendarUrl: string | null; error?: string }> {
  const ownerPhone = kapsoEnv().KAPSO_OWNER_PHONE.trim();
  if (!ownerPhone) return { sent: false, calendarUrl: input.calendarUrl, error: 'KAPSO_OWNER_PHONE no configurado' };

  const body = [
    'Casita IA: visita propuesta.',
    input.propertyInfo?.label ? `Propiedad: ${input.propertyInfo.label}` : null,
    `Oferente: ${input.chatPhone}`,
    input.appointmentStart ? `Horario: ${formatVisitDate(input.appointmentStart)}` : 'Horario: no pude leer la fecha exacta',
    input.calendarUrl ? `Google Calendar: ${input.calendarUrl}` : null,
    '',
    `Mensaje: ${input.replyText}`,
  ].filter(Boolean).join('\n');

  try {
    await sendText(ownerPhone, body);
    return { sent: true, calendarUrl: input.calendarUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[ai-reply]', 'owner notification failed', { error: message });
    return { sent: false, calendarUrl: input.calendarUrl, error: message };
  }
}

async function persistCalendarLinkMessage(input: {
  chatId: string;
  calendarUrl: string;
  propertyInfo: PropertyInfo | null;
  replyText: string;
  appointmentStart: Date;
}): Promise<{ id: string } | null> {
  const supabase = createServiceClient();
  const body = [
    'Visita propuesta',
    input.propertyInfo?.label ? `Propiedad: ${input.propertyInfo.label}` : null,
    `Horario: ${formatVisitDate(input.appointmentStart)}`,
    `Google Calendar: ${input.calendarUrl}`,
    '',
    `Mensaje enviado: ${input.replyText}`,
  ].filter(Boolean).join('\n');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: input.chatId,
      direction: 'out',
      body,
      kind: 'system',
      status: 'internal',
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[ai-reply]', 'calendar web message failed', { error: error.message });
    return null;
  }
  return data;
}

function formatVisitDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
