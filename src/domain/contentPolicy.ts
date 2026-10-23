export interface PolicyItem {
  id: string;
  en: string;
  zh: string;
}

/** SFW creator topics. Dating profiles are separate and are not posts. */
export const ALLOWED_CREATOR_TOPICS: PolicyItem[] = [
  { id: 'study', en: 'Everyday life and study in Australia', zh: '在澳大利亚的日常生活与学习' },
  { id: 'food', en: 'Food, cafes, and cooking', zh: '美食、咖啡馆与烹饪' },
  { id: 'travel', en: 'Travel and cities, without a home address', zh: '旅行与城市，不包含家庭住址' },
  { id: 'fitness', en: 'Fitness that is not sexual', zh: '非性暗示的健身' },
  { id: 'art', en: 'Art, music, and clothed fashion', zh: '艺术、音乐与着装时尚' },
  { id: 'education', en: 'Education and language learning', zh: '教育与语言学习' },
  { id: 'vlogs', en: 'Comedy and vlogs that stay non-sexual', zh: '非性内容的喜剧与影像日志' },
];

export const FORBIDDEN_CREATOR_TOPICS: PolicyItem[] = [
  { id: 'nudity', en: 'Nudity, sexual content, and pornography', zh: '裸露、性内容与色情' },
  { id: 'solicitation', en: 'Sexual solicitation, escorting, or fetish content', zh: '性招揽、伴游或恋物内容' },
  {
    id: 'paid-company',
    en: 'Selling chat time, companionship, dates, or in-person meetups',
    zh: '出售聊天时间、陪伴、约会或线下见面',
  },
  {
    id: 'minors',
    en: 'Anything sexual involving minors, or any minor presented for dating or paid content',
    zh: '任何涉及未成年人的性内容，或把未成年人用于约会或付费内容',
  },
  { id: 'hate', en: 'Hate, harassment, and threats', zh: '仇恨、骚扰与威胁' },
  { id: 'violence', en: 'Violence and illegal activity', zh: '暴力与违法活动' },
  { id: 'nonconsensual', en: 'Non-consensual or secretly recorded imagery', zh: '未经同意或偷拍的影像' },
  { id: 'rating', en: 'Face, body, or hotness scoring', zh: '对外貌、身材或“好看程度”打分' },
];

export const CREATOR_PROHIBITION = {
  en: 'Creators must not sell chat time, companionship, dates, escorting, or in-person meetups. Paid features are limited to reviewed, non-adult subscriptions and posts.',
  zh: '创作者不得出售聊天时间、陪伴、约会、伴游或线下见面。付费功能仅限于经过审核的非成人订阅与帖子。',
};
