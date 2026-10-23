

import { User, Gift, ChatSession, MembershipLevel, UserRole, Transaction, Venue, Post, LiveStream, Comment, LeaderboardUser } from './types';

export const CURRENT_USER_ID = 'me';

export const GIFTS: Gift[] = [
  { id: 'g8', name: 'Castle', price: 500, icon: '🏰', type: 'Luxury' },
  { id: 'g5', name: 'Sports Car', price: 100, icon: '🏎️', type: 'Luxury' },
  { id: 'g7', name: 'Handbag', price: 75, icon: '👜', type: 'Luxury' },
  { id: 'g4', name: 'Diamond', price: 50, icon: '💎', type: 'Luxury' },
  { id: 'g3', name: 'Perfume', price: 25, icon: '🧴', type: 'Advanced' },
  { id: 'g6', name: 'Teddy Bear', price: 15, icon: '🧸', type: 'Standard' },
  { id: 'g2', name: 'Coffee', price: 10, icon: '☕', type: 'Standard' },
  { id: 'g1', name: 'Rose', price: 5, icon: '🌹', type: 'Standard' },
];

export const COMMON_EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "mw", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "𘘾",
    "👋", "🤚", "qm", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👣", "👂", "🦻", "👃", "🫀", "🫁", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "❤️‍🔥", "❤️‍🩹", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️",
    "🔥", "✨", "🌟", "💫", "💥", "💢", "💦", "💧", "💤", "💨", "👂", "👀", "👃", "👅", "👄", "👍", "👎", "👌", "👊", "✊", "✌️", "👋", "✋", "👐", "👆", "👇", "👉", "👈", "🙌", "🙏", "👏", "💪", "🚶", "🏃", "💃", "🕺", "👯", "🙆", "🙅", "💁", "🙋", "💆", "💇", "💑", "👩‍❤️‍👩", "👨‍❤️‍👨", "💏", "👩‍❤️‍💋‍👩", "👨‍❤️‍💋‍👨", "👪", "👨‍👩‍👧", "👨‍👩‍👧‍👦", "👨‍👩‍👦‍👦", "👨‍👩‍👧‍👧", "👩‍👩‍👦", "👩‍👩‍👧", "👩‍👩‍👧‍👦", "👩‍👩‍👦‍👦", "👩‍👩‍👧‍👧", "👨‍👨‍👦", "👨‍👨‍👧", "👨‍👨‍👧‍👦", "👨‍👨‍👦‍👦", "👨‍👨‍👧‍👧", "👚", "👕", "👖", "👔", "👗", "👙", "👘", "💄", "💋", "👣", "👠", "👡", "👢", "👞", "👟", "🧢", "👒", "🎩", "🎓", "👑", "⛑️", "🎒", "👝", "👛", "👜", "💼", "👓", "🕶️", "💍", "🌂",
];

export const MOCK_VENUES: Venue[] = [
  {
    id: 'v1',
    name: 'The Grounds of Alexandria',
    type: 'Cafe',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&fit=crop',
    distance: '2.5km',
    rating: 4.8,
    description: 'Beautiful garden cafe perfect for a first date.',
    priceRange: '$$'
  },
  {
    id: 'v2',
    name: 'Moonlight Cinema',
    type: 'Activity',
    image: 'https://images.unsplash.com/photo-1517604931442-710c22765604?w=800&fit=crop',
    distance: '4.0km',
    rating: 4.5,
    description: 'Outdoor movie experience under the stars.',
    priceRange: '$$'
  },
  {
    id: 'v3',
    name: 'Opera Bar',
    type: 'Restaurant',
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&fit=crop',
    distance: '1.2km',
    rating: 4.7,
    description: 'Iconic views of the bridge and opera house.',
    priceRange: '$$$'
  },
  {
    id: 'v4',
    name: 'Hyde Park Picnic',
    type: 'Park',
    image: 'https://images.unsplash.com/photo-1596230635201-9c16b5155c51?w=800&fit=crop',
    distance: '0.8km',
    rating: 4.9,
    description: 'A relaxing spot for a walk and talk.',
    priceRange: '$'
  }
];

export const MOCK_USER: User = {
  id: CURRENT_USER_ID,
  name: 'Alex Chen',
  age: 21,
  gender: 'male',
  avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop',
  photos: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop'
  ],
  bio: 'Computer Science student. Love photography and hiking.',
  distance: '0km',
  role: UserRole.Sender,
  school: 'University of Sydney',
  isVerified: true,
  isKYCVerified: true,
  membership: MembershipLevel.Standard,
  tags: ['Photography', 'Coding', 'Hiking']
};

export const MOCK_PROFILES: User[] = [
  {
    id: 'u1',
    name: 'Sarah Kim',
    age: 20,
    gender: 'female',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1200&fit=crop',
    photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1485206412256-701b70e3ed44?w=800&h=1200&fit=crop'
    ],
    bio: 'Art history major. Looking for someone to visit galleries with and maybe grab a coffee afterwards ☕️✨',
    job: 'Gallery Assistant',
    distance: '2km',
    role: UserRole.Receiver,
    school: 'UNSW',
    isVerified: true,
    isKYCVerified: true,
    membership: MembershipLevel.Plus,
    tags: ['Art', 'Museums', 'Coffee', 'Design']
  },
  {
    id: 'u2',
    name: 'Jessica Li',
    age: 22,
    gender: 'female',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop',
    photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    bio: 'Foodie and traveler. Let’s explore the city! Always down for a rooftop bar or a hidden ramen spot 🍜',
    job: 'Marketing Intern',
    distance: '5km',
    role: UserRole.Receiver,
    school: 'UTS',
    isVerified: false,
    isKYCVerified: false,
    membership: MembershipLevel.Standard,
    tags: ['Travel', 'Food', 'Music', 'Festivals']
  },
  {
    id: 'u3',
    name: 'Emily Davis',
    age: 19,
    gender: 'female',
    avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=800&h=1200&fit=crop',
    photos: [
        'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=1200&fit=crop'
    ],
    bio: 'Psychology student. Love deep conversations about the universe and everything in between.',
    distance: '1.5km',
    role: UserRole.Receiver,
    school: 'Macquarie University',
    isVerified: true,
    isKYCVerified: false,
    membership: MembershipLevel.Premium,
    tags: ['Psychology', 'Reading', 'Yoga', 'Meditation']
  },
  {
    id: 'u4',
    name: 'Michael Brown',
    age: 23,
    gender: 'male',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop',
    photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=800&h=1200&fit=crop'
    ],
    bio: 'Engineering student. Love robotics and sci-fi. Building my own drone in my free time.',
    distance: '3km',
    role: UserRole.Receiver,
    school: 'University of Sydney',
    isVerified: true,
    isKYCVerified: true,
    membership: MembershipLevel.Standard,
    tags: ['Engineering', 'Robotics', 'Sci-Fi', 'Gaming']
  }
];

export const MOCK_FRIENDS: User[] = [
    MOCK_PROFILES[0], // Sarah
    MOCK_PROFILES[3], // Michael
    {
        id: 'u7',
        name: 'Sophie',
        age: 21,
        gender: 'female',
        avatar: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&fit=crop',
        bio: 'Fashion design student.',
        distance: '6km',
        photos: [],
        role: UserRole.Receiver,
        school: 'University of Sydney',
        isVerified: true,
        isKYCVerified: true,
        membership: MembershipLevel.Standard,
        tags: []
    }
];

export const MOCK_CHATS: ChatSession[] = [
  {
    id: 'c1',
    partnerId: 'u5',
    partnerName: 'Grace',
    partnerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    status: 'active',
    cycleStartDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    messages: [
      { id: 'm1', senderId: CURRENT_USER_ID, text: 'Hi Grace! Thanks for connecting.', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
      { id: 'm2', senderId: 'u5', text: 'Hey Alex! Nice to meet you.', timestamp: Date.now() - 2.9 * 24 * 60 * 60 * 1000 }
    ],
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    senderMessageCount: 1,
    giftId: 'g2'
  },
  {
    id: 'c2',
    partnerId: 'u6',
    partnerName: 'Lily',
    partnerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    status: 'initial',
    messages: [
      { id: 'm3', senderId: CURRENT_USER_ID, text: 'Hey, I really liked your profile!', timestamp: Date.now() - 100000 }
    ],
    createdAt: Date.now() - 100000,
    senderMessageCount: 1,
    giftId: 'g1'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'gift_sent', amount: 10, date: '2023-10-25', description: 'Gift to Grace', status: 'completed' },
  { id: 't2', type: 'earnings', amount: 8.25, date: '2023-10-20', description: 'Chat cycle completed with Zoe', status: 'completed' },
  { id: 't3', type: 'gift_sent', amount: 5, date: '2023-10-26', description: 'Gift to Lily', status: 'completed' },
];

export const MOCK_COMMENTS: Comment[] = [
    {
        id: 'cmt1',
        authorId: 'u2',
        authorName: 'Jessica Li',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        text: 'This looks amazing! 😍',
        timestamp: Date.now() - 3500000
    },
    {
        id: 'cmt2',
        authorId: 'u5',
        authorName: 'Grace',
        authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        text: 'I was there yesterday too!',
        timestamp: Date.now() - 3400000
    }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    authorName: 'Sarah Kim',
    authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
    content: 'Just visited the new exhibition at the MCA. Absolutely breathtaking! 🎨 Anyone want to join next weekend?',
    image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&h=500&fit=crop',
    likes: 124,
    comments: 2,
    commentsList: [MOCK_COMMENTS[0], MOCK_COMMENTS[1]],
    timestamp: Date.now() - 3600000, // 1 hour ago
    isLiked: false
  },
  {
    id: 'p2',
    authorId: 'u3',
    authorName: 'Emily Davis',
    authorAvatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=200&h=200&fit=crop',
    content: 'Finals week is killing me 📚☕ Need serious coffee recommendations near Macquarie Uni ASAP!',
    likes: 45,
    comments: 32,
    commentsList: [],
    timestamp: Date.now() - 7200000, // 2 hours ago
    isLiked: true
  },
  {
    id: 'p3',
    authorId: 'u2',
    authorName: 'Jessica Li',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    content: 'Just booked my trip to Japan! 🇯🇵 So excited for the cherry blossoms.',
    likes: 210,
    comments: 56,
    commentsList: [],
    timestamp: Date.now() - 86400000, // 1 day ago
    isLiked: false
  }
];

export const MOCK_LIVESTREAMS: LiveStream[] = [
  {
    id: 'l1',
    streamerId: 'u1',
    streamerName: 'Sarah Kim',
    streamerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
    title: 'Late night painting session 🎨 Chat with me!',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&fit=crop',
    viewers: 1205,
    tags: ['Art', 'Chill', 'Chat']
  },
  {
    id: 'l2',
    streamerId: 'u5',
    streamerName: 'Grace',
    streamerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    title: 'GRWM for a date! 💄 Makeup tips & gossip',
    thumbnail: 'https://images.unsplash.com/photo-1512413314640-c3185b58afaa?w=800&fit=crop',
    viewers: 850,
    tags: ['Beauty', 'GRWM', 'Lifestyle']
  },
  {
    id: 'l3',
    streamerId: 'u2',
    streamerName: 'Jessica Li',
    streamerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    title: 'Exploring the night markets 🍜 Come eat with me',
    thumbnail: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&fit=crop',
    viewers: 2300,
    tags: ['Food', 'Travel', 'IRL']
  }
];

export const MOCK_LEADERBOARD_INCOME: LeaderboardUser[] = [
    { id: 'lb1', rank: 1, name: 'Jessica Li', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', value: '$2,450', trend: 'up' },
    { id: 'lb2', rank: 2, name: 'Grace', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', value: '$1,920', trend: 'same' },
    { id: 'lb3', rank: 3, name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop', value: '$1,850', trend: 'down' },
    { id: 'lb4', rank: 4, name: 'Emily Davis', avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=200&h=200&fit=crop', value: '$1,200', trend: 'up' },
    { id: 'lb5', rank: 5, name: 'Lily', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', value: '$980', trend: 'up' },
    { id: 'lb6', rank: 6, name: 'Zoe', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', value: '$850', trend: 'down' },
    { id: 'lb7', rank: 7, name: 'Anna', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', value: '$720', trend: 'same' },
];

export const MOCK_LEADERBOARD_POPULARITY: LeaderboardUser[] = [
    { id: 'lb3', rank: 1, name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop', value: '125k 🔥', trend: 'up' },
    { id: 'lb1', rank: 2, name: 'Jessica Li', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', value: '98k 🔥', trend: 'up' },
    { id: 'lb4', rank: 3, name: 'Emily Davis', avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=200&h=200&fit=crop', value: '85k 🔥', trend: 'down' },
    { id: 'lb2', rank: 4, name: 'Grace', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', value: '72k 🔥', trend: 'same' },
    { id: 'lb5', rank: 5, name: 'Lily', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', value: '64k 🔥', trend: 'up' },
    { id: 'lb6', rank: 6, name: 'Zoe', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', value: '55k 🔥', trend: 'down' },
];