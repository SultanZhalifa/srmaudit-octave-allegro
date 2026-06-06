/**
 * AI service. With a user-supplied key it calls a real provider (auto-detected:
 * Google Gemini for `AIza…` keys, OpenRouter for `sk-or-…`). With no key it
 * answers from the factual OWASP/OCTAVE knowledge base — never invented content.
 */
import { config } from '@/core/config';
import { findKnowledge } from '@/data/knowledge-base';
import { prefs } from './preferences';

export type AiProvider = 'Google Gemini' | 'OpenRouter' | 'Custom' | '';

export function detectProvider(key: string): AiProvider {
  if (!key) return '';
  if (key.startsWith('AIza')) return 'Google Gemini';
  if (key.startsWith('sk-or-')) return 'OpenRouter';
  return 'Custom';
}

export function hasLiveAi(): boolean {
  return prefs.aiKey().length > 0;
}

/** Call the configured provider. Throws on transport/provider error. */
export async function callAi(prompt: string, system = '', maxTokens = 2048): Promise<string> {
  const key = prefs.aiKey();
  if (!key) throw new Error('No AI API key configured');

  if (key.startsWith('AIza')) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.geminiModel}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message ?? 'Gemini error');
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.';
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': location.href,
      'X-Title': 'SRMAudit 2026',
    },
    body: JSON.stringify({
      model: config.ai.openrouterModel,
      max_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? 'OpenRouter error');
  return data?.choices?.[0]?.message?.content ?? 'No response received.';
}

/** Knowledge-base answer for offline mode (returns plain text with **markdown**). */
export function knowledgeAnswer(query: string): { title: string; body: string } | null {
  const entry = findKnowledge(query);
  return entry ? { title: entry.title, body: entry.body } : null;
}
