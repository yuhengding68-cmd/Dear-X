import type { Block, Chat, Like, Match, Message } from '../types';

export interface MatchTables {
  likes: Like[];
  matches: Match[];
  chats: Chat[];
  blocks: Block[];
  messages: Record<string, Message[]>;
}

export function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function pairKey(a: string, b: string): string {
  return sortedPair(a, b).join('_');
}

export function blockedSet(blocks: Block[], uid: string): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    if (block.blockerId === uid) ids.add(block.blockedId);
    if (block.blockedId === uid) ids.add(block.blockerId);
  }
  return ids;
}

export function isBlockedPair(blocks: Block[], a: string, b: string): boolean {
  return blocks.some(
    (block) =>
      (block.blockerId === a && block.blockedId === b) ||
      (block.blockerId === b && block.blockedId === a),
  );
}

export interface LikeResult {
  tables: MatchTables;
  matched: boolean;
  matchId?: string;
  chatId?: string;
}

/**
 * Mutual matching only. A chat exists after both people have a like.
 * There is no random chance and no paid unlock.
 */
export function applyLike(tables: MatchTables, fromUserId: string, toUserId: string, now: string): LikeResult {
  if (fromUserId === toUserId) throw new Error('You cannot like your own profile.');
  if (isBlockedPair(tables.blocks, fromUserId, toUserId)) {
    throw new Error('This person is blocked.');
  }
  const already = tables.likes.some((like) => like.fromUserId === fromUserId && like.toUserId === toUserId);
  const likes = already
    ? tables.likes
    : [
        ...tables.likes,
        {
          id: `${fromUserId}_${toUserId}`,
          fromUserId,
          toUserId,
          createdAt: now,
        },
      ];
  const reciprocal = likes.some((like) => like.fromUserId === toUserId && like.toUserId === fromUserId);
  if (!reciprocal) {
    return { tables: { ...tables, likes }, matched: false };
  }
  const key = pairKey(fromUserId, toUserId);
  const matchId = `match_${key}`;
  const chatId = `chat_${key}`;
  const matches = tables.matches.some((match) => match.id === matchId)
    ? tables.matches
    : [
        ...tables.matches,
        {
          id: matchId,
          userIds: sortedPair(fromUserId, toUserId),
          createdAt: now,
          chatId,
        },
      ];
  const chats = tables.chats.some((chat) => chat.id === chatId)
    ? tables.chats
    : [
        ...tables.chats,
        {
          id: chatId,
          participantIds: sortedPair(fromUserId, toUserId),
          createdAt: now,
          lastMessageText: null,
          lastMessageAt: null,
        },
      ];
  const messages = tables.messages[chatId] ? tables.messages : { ...tables.messages, [chatId]: [] };
  return {
    tables: { ...tables, likes, matches, chats, messages },
    matched: true,
    matchId,
    chatId,
  };
}
