
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  updateDoc, 
  doc, 
  setDoc, 
  orderBy, 
  limit, 
  onSnapshot,
  getDoc
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "./firebaseConfig";
import { User, ChatSession, Message, Transaction, LiveStream, Gift, LeaderboardUser } from './types';
import { MOCK_PROFILES, MOCK_USER, MOCK_CHATS, MOCK_TRANSACTIONS, MOCK_LIVESTREAMS, MOCK_LEADERBOARD_POPULARITY, GIFTS, CURRENT_USER_ID } from './constants';
import { checkContentSafety } from './geminiService';

class DearXAPI {
  
  // --- Auth ---
  async login(phone: string): Promise<User> {
    try {
      // For prototype: Anonymous login (or use signInWithPhoneNumber for real prod)
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      // Check if user profile exists in Firestore
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { ...userSnap.data(), id: uid } as User;
      } else {
        // Create new user profile in Firestore
        const newUser = { ...MOCK_USER, id: uid, name: `User ${uid.substring(0,4)}` };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      console.error("Login failed, falling back to mock", error);
      return MOCK_USER;
    }
  }

  // --- Discovery ---
  async getProfiles(filters: { gender: string, maxDistance: number, ageRange: [number, number] }): Promise<User[]> {
    try {
      // In a real app, use GeoFire or Algolia for distance filtering
      // Here we just fetch users and filter client-side for the prototype
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(20));
      const snapshot = await getDocs(q);
      
      const profiles: User[] = [];
      snapshot.forEach(doc => {
        if (doc.id !== auth.currentUser?.uid) {
           profiles.push({ ...doc.data(), id: doc.id } as User);
        }
      });

      if (profiles.length === 0) return MOCK_PROFILES; // Fallback if DB empty
      return profiles;
    } catch (e) {
      console.warn("Using mock profiles due to error or no config", e);
      return MOCK_PROFILES;
    }
  }

  async swipe(profileId: string, direction: 'left' | 'right'): Promise<{ matched: boolean }> {
    if (!auth.currentUser) return { matched: false };
    
    // Record swipe in Firestore
    const swipeRef = collection(db, "swipes");
    await addDoc(swipeRef, {
      swiperId: auth.currentUser.uid,
      targetId: profileId,
      direction,
      timestamp: Date.now()
    });

    // Mock match logic (real logic should be a Cloud Function trigger)
    return { matched: direction === 'right' && Math.random() > 0.7 };
  }

  // --- Wallet ---
  async getBalance(): Promise<number> {
    if (!auth.currentUser) return 240;
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    return userDoc.exists() ? (userDoc.data().balance || 240) : 240;
  }

  async topUp(amount: number): Promise<number> {
    if (!auth.currentUser) return 0;
    
    // In production: Create Payment Intent via Stripe, then update balance via Webhook/Cloud Function
    // Here: Update Firestore directly (INSECURE for production, OK for prototype)
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const currentBalance = userDoc.exists() ? (userDoc.data().balance || 0) : 0;
    const newBalance = currentBalance + amount;
    
    await updateDoc(userRef, { balance: newBalance });
    
    // Record Transaction
    await addDoc(collection(db, "transactions"), {
      userId: auth.currentUser.uid,
      type: 'top_up',
      amount,
      date: new Date().toISOString(),
      description: 'Gems Top Up'
    });

    return newBalance;
  }

  async getTransactions(): Promise<Transaction[]> {
    // Return mock for now as UI expects specific format, easy to swap with Firestore query
    return MOCK_TRANSACTIONS;
  }

  // --- Chat ---
  async createChat(partner: User): Promise<ChatSession> {
    if (!auth.currentUser) throw new Error("Not logged in");
    
    // Check if chat exists
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, 
      where("participants", "array-contains", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    
    let existingChat: ChatSession | null = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(partner.id)) {
        existingChat = { ...data, id: doc.id } as ChatSession;
      }
    });

    if (existingChat) return existingChat;

    // Create new chat
    const newChatData = {
      participants: [auth.currentUser.uid, partner.id],
      partnerId: partner.id,
      partnerName: partner.name,
      partnerAvatar: partner.avatar,
      status: 'initial',
      createdAt: Date.now(),
      senderMessageCount: 0,
      messages: [] // Initial empty messages
    };

    const docRef = await addDoc(chatsRef, newChatData);
    return { ...newChatData, id: docRef.id } as ChatSession;
  }

  async getChats(): Promise<ChatSession[]> {
    if (!auth.currentUser) return MOCK_CHATS;

    try {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", auth.currentUser.uid));
      const snapshot = await getDocs(q);
      
      const chats: ChatSession[] = [];
      snapshot.forEach(doc => {
         chats.push({ ...doc.data(), id: doc.id } as ChatSession);
      });

      return chats.length > 0 ? chats : MOCK_CHATS;
    } catch (e) {
      console.warn("Using mock chats", e);
      return MOCK_CHATS;
    }
  }

  async sendMessage(chatId: string, text: string): Promise<{ message: Message, safe: boolean, reason?: string }> {
    // 1. Safety Check (Gemini)
    const safety = await checkContentSafety(text);
    if (!safety.safe) {
      return { 
        message: { id: 'err', senderId: 'system', text: '', timestamp: 0 }, 
        safe: false, 
        reason: safety.reason 
      };
    }

    // 2. Save to Firestore
    // In a real app, use a subcollection 'chats/{chatId}/messages'
    // Here we update the 'messages' array in the chat document for simplicity
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      const currentMessages = chatDoc.data().messages || [];
      const newMessage: Message = {
        id: `m_${Date.now()}`,
        senderId: auth.currentUser?.uid || CURRENT_USER_ID,
        text: text,
        timestamp: Date.now()
      };
      
      await updateDoc(chatRef, {
        messages: [...currentMessages, newMessage]
      });
      
      return { message: newMessage, safe: true };
    }
    
    return { message: {} as Message, safe: false, reason: "Chat not found" };
  }

  async sendGift(receiverId: string, gift: Gift): Promise<boolean> {
    const balance = await this.getBalance();
    if (balance < gift.price) return false;

    // Deduct balance
    if (auth.currentUser) {
       const userRef = doc(db, "users", auth.currentUser.uid);
       await updateDoc(userRef, { balance: balance - gift.price });
       return true;
    }
    return false;
  }
}

export const api = new DearXAPI();
