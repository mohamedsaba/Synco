import { describe, expect, it } from 'vitest';
import { POST } from '../../apps/web/app/api/contact/route';
const valid = {
  name: 'Test visitor',
  email: 'visitor@example.com',
  company: '',
  topic: 'Hirearchy Software',
  message: 'A synthetic message for testing.',
};
function request(body: unknown, origin = 'https://hirearchy.example') {
  return new Request('https://hirearchy.example/api/contact', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
describe('Contact boundary', () => {
  it('uses the external Host when Next reconstructs an internal request URL', async () => {
    const response = await POST(
      new Request('http://localhost:3103/api/contact', {
        method: 'POST',
        headers: {
          origin: 'http://127.0.0.1:3103',
          host: '127.0.0.1:3103',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valid),
      }),
    );
    expect(response.status).toBe(503);
  });
  it('never claims delivery while a destination is not configured', async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: expect.stringContaining('has not been sent'),
    });
  });
  it('rejects invalid input, oversized bodies and cross-origin submissions', async () => {
    expect(
      (await POST(request({ ...valid, email: 'not-an-email' }))).status,
    ).toBe(400);
    expect(
      (await POST(request({ ...valid, topic: 'Made up product' }))).status,
    ).toBe(400);
    expect(
      (await POST(request({ ...valid, message: ' '.repeat(25000) }))).status,
    ).toBe(413);
    expect((await POST(request(valid, 'https://other.example'))).status).toBe(
      403,
    );
  });
  it('rejects malformed JSON without exposing server errors', async () => {
    const response = await POST(
      new Request('https://hirearchy.example/api/contact', {
        method: 'POST',
        headers: {
          origin: 'https://hirearchy.example',
          'Content-Type': 'application/json',
        },
        body: '{',
      }),
    );
    expect(response.status).toBe(400);
  });
});
