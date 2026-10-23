import { moderateWithKeywordStub, type ModerationVerdict } from './keywordModeration';

export type ModerationContext = 'chat' | 'creator_post';

/**
 * Server-side moderation. Keyword rejects return immediately.
 * Anything else is sent to Gemini. Missing API key or an unreadable
 * model response fails closed — content is not treated as allowed.
 */
export async function moderateText(apiKey: string, text: string, context: ModerationContext): Promise<ModerationVerdict> {
  const keyword = moderateWithKeywordStub(text);
  if (!keyword.allowed) return keyword;
  if (!apiKey.trim()) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const prompt = [
    'You moderate DearX, a safety-first dating app for adults in Australia, plus a separate non-adult creator section.',
    'Return JSON only: {"allowed": boolean, "categories": string[], "reason": string}.',
    'Reject: nudity, sexual content, pornography, sexual services, escorting, selling chat time, companionship, dates, or in-person meetups, minors, hate, harassment, threats, violence, scams, and face or hotness scoring.',
    'Allow ordinary conversation about study, food, friendship, and meeting in a public place when nobody is being paid for company.',
    `Context: ${context}`,
    `Text: ${JSON.stringify(text).slice(0, 8000)}`,
  ].join('\n');

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Gemini moderation failed (${response.status}).`);
  }
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  let parsed: Partial<ModerationVerdict>;
  try {
    parsed = JSON.parse(raw) as Partial<ModerationVerdict>;
  } catch {
    throw new Error('Gemini moderation returned an unreadable verdict.');
  }
  if (typeof parsed.allowed !== 'boolean') {
    throw new Error('Gemini moderation returned an unreadable verdict.');
  }
  return {
    allowed: parsed.allowed,
    categories: Array.isArray(parsed.categories) ? parsed.categories.map(String) : [],
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
  };
}
