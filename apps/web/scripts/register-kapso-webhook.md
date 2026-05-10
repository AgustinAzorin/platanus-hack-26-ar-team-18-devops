# Registrar el webhook de Kapso

Pasos para conectar Kapso → tu Next.js local. Hacelo una sola vez (en dev) y otra cuando deployes a prod.

## 1. Correr la SQL

Pegá [`scripts/sql/001_chats_messages.sql`](sql/001_chats_messages.sql) en el SQL editor de Supabase y ejecutalo. Crea `chats` + `messages` y habilita Realtime.

## 2. Levantar el web local

```powershell
pnpm --filter web dev
```

Por defecto queda en `http://localhost:3000`.

## 3. Levantar ngrok (o cloudflared)

```powershell
pnpm dlx ngrok http 3000
# o:  cloudflared tunnel --url http://localhost:3000
```

Copiá la URL HTTPS que te tira (ej. `https://abcd-1234.ngrok-free.app`).

## 4. Registrar el webhook en Kapso

Desde la raíz del repo:

```powershell
$env:KAPSO_API_KEY = "<tu_api_key>"
$env:KAPSO_API_BASE_URL = "https://api.kapso.ai"
node ".agents/skills/integrate-whatsapp/scripts/create.js" `
  --phone-number-id 1027402203799930 `
  --url "https://<tu-subdominio>.ngrok-free.app/api/kapso/webhook" `
  --events "whatsapp.message.received,whatsapp.message.sent,whatsapp.message.delivered,whatsapp.message.read,whatsapp.message.failed" `
  --kind kapso `
  --payload-version v2 `
  --buffer-enabled false
```

La respuesta incluye un `signing_secret`. Pegalo en `apps/web/.env`:

```
KAPSO_WEBHOOK_SECRET="<signing_secret>"
```

Reiniciá el dev server para que tome la env nueva.

## 5. Probar entrada (mensaje del propietario → tu app)

Desde tu celular, mandale un WhatsApp al **+1 555-807-6615** (el número Test Business). En unos segundos debería:
- aparecer una nueva conversación en `/chats`
- el mensaje insertado en la tabla `messages`
- el status de los outbound actualizado en tiempo real

Si no aparece, mirá los logs:
```powershell
node ".agents/skills/integrate-whatsapp/scripts/list.js" --phone-number-id 1027402203799930
node ".agents/skills/integrate-whatsapp/scripts/test.js" --webhook-id <id>
```

## 6. Probar salida (tu app → propietario)

El teléfono del propietario sale de `propiedades.seller_whatsapp_digits` (el `posting_id` que mande el cliente sirve solo para asociar el chat al aviso).

Por `posting_id` (lookup automático):
```powershell
curl -X POST http://localhost:3000/api/chats `
  -H "Content-Type: application/json" `
  -d '{ "posting_id": "<id-del-aviso>", "initial_message": "Hola" }'
```

O por número directo:
```powershell
curl -X POST http://localhost:3000/api/chats `
  -H "Content-Type: application/json" `
  -d '{ "phone": "5411XXXXXXXX", "initial_message": "Hola" }'
```

Notas:
- Si nadie te escribió primero (ventana de 24h cerrada) → se manda el template `mensaje_prueba`. Si Meta todavía no lo aprobó (`status=PENDING`), Kapso devuelve error.
- Si el número ya escribió hace < 24h → se manda como texto libre.
- El helper `toE164` acepta `5411XXXXXXXX`, `11XXXXXXXX` o `+5411XXXXXXXX` indistinto y los normaliza.

## 7. Para producción (Vercel)

Sumar las mismas envs en Vercel → Project → Environment Variables. La URL del webhook tiene que apuntar al dominio de prod, así que vas a registrar **otro** webhook en Kapso (uno por entorno).
