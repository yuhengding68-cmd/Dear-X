export interface ModerationVerdict {
  allowed: boolean;
  categories: string[];
  reason: string;
}

/**
 * Offline keyword gate used by demo mode and as a fast reject before Gemini.
 * Gemini itself runs only in Cloud Functions. This list is intentionally narrow
 * so ordinary dating chat ("coffee", "meet at a cafe") is allowed.
 */
const RULES: { category: string; pattern: RegExp; reason: string }[] = [
  {
    category: 'minor_safety',
    pattern: /\b(underage|under-age|child\s*porn|csam|jailbait|loli)\b|儿童色情|恋童|未成年人性/i,
    reason: 'Content involving minors is forbidden.',
  },
  {
    category: 'sexual_services',
    pattern: /\b(escort|sugar\s*baby|sex\s*work|hooker)\b|援交|包养|卖淫|性交易/i,
    reason: 'Sexual services are not allowed.',
  },
  {
    category: 'paid_meetup',
    pattern:
      /\b(?:pay(?:ing)?|paid)\s+(?:\w+\s+){0,3}(?:to|for)\s+(?:meet|a\s+date|date|companionship|chat)\b|\b(?:sell(?:ing)?|sold)\s+(?:chat|companionship|dates|meetups)\b|付费见面|收费陪伴|卖聊天|出售陪伴/i,
    reason: 'Selling chat, companionship, or meetups is not allowed.',
  },
  {
    category: 'sexual_content',
    pattern: /\b(nudes?|porn|xxx|onlyfans|send\s+nudes)\b|裸照|色情片|约炮/i,
    reason: 'Sexual content is not allowed.',
  },
];

export function moderateWithKeywordStub(text: string): ModerationVerdict {
  const trimmed = text.trim();
  if (!trimmed) {
    return { allowed: false, categories: ['empty'], reason: 'Message is empty.' };
  }
  if (trimmed.length > 2000) {
    return { allowed: false, categories: ['length'], reason: 'Message is too long.' };
  }
  const hits = RULES.filter((rule) => rule.pattern.test(trimmed));
  if (hits.length === 0) {
    return { allowed: true, categories: [], reason: '' };
  }
  return {
    allowed: false,
    categories: hits.map((hit) => hit.category),
    reason: hits[0].reason,
  };
}
