import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAi } from '@/services/ai-service';
import { prefs } from '@/services/preferences';

const GEMINI_KEY = 'AIzaFAKE-key-for-the-test';
const OPENROUTER_KEY = 'sk-or-v1-fake-key-for-the-test';

function mockFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('callAi', () => {
  it('sends a Gemini key in a header and never in the URL', async () => {
    prefs.setAiKey(GEMINI_KEY);
    const fetchMock = mockFetch({ candidates: [{ content: { parts: [{ text: 'hello' }] } }] });

    expect(await callAi('question')).toBe('hello');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/generativelanguage\.googleapis\.com\/.+:generateContent$/);
    expect(url).not.toContain(GEMINI_KEY);
    expect(url).not.toContain('key=');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(GEMINI_KEY);
    expect(String(init.body)).not.toContain(GEMINI_KEY);
  });

  it('sends an OpenRouter key as a bearer header and never in the URL', async () => {
    prefs.setAiKey(OPENROUTER_KEY);
    const fetchMock = mockFetch({ choices: [{ message: { content: 'hi' } }] });

    expect(await callAi('question')).toBe('hi');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${OPENROUTER_KEY}`);
    expect(String(init.body)).not.toContain(OPENROUTER_KEY);
  });

  it('refuses to call anything without a key', async () => {
    const fetchMock = mockFetch({});
    await expect(callAi('question')).rejects.toThrow(/No AI API key/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces a provider error message', async () => {
    prefs.setAiKey(GEMINI_KEY);
    mockFetch({ error: { message: 'API key not valid' } });
    await expect(callAi('question')).rejects.toThrow('API key not valid');
  });
});
