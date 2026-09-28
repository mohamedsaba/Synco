import { z } from 'zod';
const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  company: z.string().trim().max(160).optional(),
  topic: z.enum([
    'Hirearchy Software',
    'Another discipline',
    'General question',
  ]),
  message: z.string().trim().min(10).max(5000),
});
export async function POST(request: Request) {
  // Next may reconstruct an internal URL behind a proxy; Host is the browser's destination.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? new URL(request.url).host;
  let sameHost = false;
  try {
    const source = new URL(origin ?? '');
    sameHost =
      source.origin === origin &&
      source.host === host &&
      ['http:', 'https:'].includes(source.protocol);
  } catch {
    /* Missing or malformed Origin is rejected below. */
  }
  if (!sameHost || request.headers.get('sec-fetch-site') === 'cross-site')
    return Response.json(
      { error: 'Please send your message from the Contact page.' },
      { status: 403 },
    );
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'Invalid message format.' }, { status: 415 });
  // Bound actual streamed bytes as well as Content-Length before parsing untrusted input.
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json(
      { error: 'Please complete the contact form.' },
      { status: 400 },
    );
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 24000) {
        await reader.cancel();
        return Response.json(
          {
            error: 'Your message is too long. Please shorten it and try again.',
          },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = contactSchema.safeParse(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (!parsed.success)
      return Response.json(
        {
          error:
            'Please check your name, email, topic and message (10–5,000 characters).',
        },
        { status: 400 },
      );
  } catch {
    return Response.json(
      { error: 'Your message could not be read. Please try again.' },
      { status: 400 },
    );
  }
  return Response.json(
    {
      error:
        'The contact form is not accepting messages yet. Your message has not been sent; please keep a copy and try again later.',
    },
    { status: 503 },
  );
}
