import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  Heart, 
  ThumbsUp,
  MessageCircle, 
  User as UserIcon, 
  Wallet, 
  X, 
  Check, 
  Send, 
  ShieldAlert, 
  Clock, 
  Gem,
  MoreVertical,
  LogOut,
  ChevronLeft,
  Gift as GiftIcon,
  Sparkles,
  MapPin,
  Briefcase,
  Info,
  RotateCcw,
  Zap,
  Star,
  Settings,
  ChevronDown,
  Compass,
  Calendar,
  Video,
  PenTool,
  Share2,
  MoreHorizontal,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  StopCircle,
  Trophy,
  Flame,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  UploadCloud,
  ShieldCheck,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  Smile,
  AlertTriangle,
  Ban,
  Search,
  CreditCard,
  Building,
  Bell,
  HelpCircle,
  Globe,
  ChevronRight,
  Filter,
  Phone,
  Image as ImageIcon,
  Sticker,
  Flag,
  Plus,
  BadgeCheck,
  History,
  Trash2,
  BellRing,
  Eye,
  EyeOff,
  Smartphone as PhoneIcon,
  Mail
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  User, 
  Gift, 
  ChatSession, 
  Message, 
  MembershipLevel, 
  UserRole, 
  Transaction,
  Venue, 
  Post, 
  LiveStream, 
  Comment, 
  ReportReason, 
  LeaderboardUser
} from './types';
import { 
  MOCK_PROFILES, 
  MOCK_CHATS, 
  MOCK_FRIENDS,
  MOCK_USER, 
  GIFTS, 
  MOCK_TRANSACTIONS, 
  CURRENT_USER_ID, 
  MOCK_VENUES,
  MOCK_POSTS,
  MOCK_LIVESTREAMS,
  MOCK_COMMENTS,
  COMMON_EMOJIS,
  MOCK_LEADERBOARD_INCOME,
  MOCK_LEADERBOARD_POPULARITY
} from './constants';
import { checkContentSafety } from './geminiService';

// --- Shared Logic ---

const getRevenueShare = (level: MembershipLevel) => {
  switch(level) {
    case MembershipLevel.Premium: return 0.60;
    case MembershipLevel.Plus: return 0.55;
    default: return 0.50;
  }
};

type AuthStep = 'login' | 'phone-input' | 'otp-input' | 'kyc-intro' | 'kyc-upload';

interface FilterState {
  ageRange: [number, number];
  gender: 'all' | 'male' | 'female';
  maxDistance: number;
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  icon: Icon
}: { 
  children?: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'cyber' | 'white'; 
  className?: string;
  disabled?: boolean;
  icon?: any;
}) => {
  const baseStyle = "w-full py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg";
  
  const variants = {
    primary: "bg-vibe-gradient text-white shadow-glow-vibe hover:shadow-brand-blue/40 border border-white/10",
    secondary: "bg-slate-800 text-white hover:bg-slate-700",
    outline: "border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/10",
    ghost: "text-brand-subtext hover:text-white hover:bg-white/5 shadow-none",
    glass: "glass text-white hover:bg-white/10",
    cyber: "bg-cyber-gradient text-black shadow-glow-cyber hover:brightness-110 border border-yellow-200/50",
    white: "bg-white text-black hover:bg-gray-100"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// Brand Logo X Component for Navigation
const LogoX = (props: any) => (
  <svg 
    viewBox="0 0 24 24" 
    {...props}
    fill="none"
    stroke="none"
  >
    <text 
      x="50%" 
      y="55%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fontSize="22" 
      fontWeight="900" 
      fill="currentColor"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      X
    </text>
  </svg>
);

const GiftSelector = ({ onSelect, onClose }: { onSelect: (gift: Gift) => void, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full max-w-md bg-[#1C1C33] rounded-t-3xl p-6 border-t border-white/20 shadow-2xl animate-slide-up relative z-10">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">Send a Gift <Gem className="w-4 h-4 text-brand-yellow" /></h3>
            <button onClick={onClose} className="p-1 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
         </div>
         
         <div className="grid grid-cols-4 gap-4 mb-6">
            {GIFTS.map(gift => (
               <button 
                 key={gift.id} 
                 onClick={() => onSelect(gift)}
                 className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group"
               >
                  <div className="w-12 h-12 flex items-center justify-center text-3xl bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                     {gift.icon}
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-bold text-white">{gift.name}</p>
                     <p className="text-[10px] text-brand-yellow flex items-center justify-center gap-0.5">
                       <Gem className="w-3 h-3" /> {gift.price}
                     </p>
                  </div>
               </button>
            ))}
         </div>

         <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
             <div className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-brand-yellow" />
                <span className="text-white font-bold">1,240</span>
             </div>
             <button className="text-brand-blue text-sm font-bold hover:underline">Top Up</button>
         </div>
      </div>
    </div>
  );
};

const LiveStreamView = ({ stream, onClose }: { stream: LiveStream, onClose: () => void }) => {
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', authorName: 'Alex', text: 'Love this! 🔥', authorAvatar: '', authorId: 'u1', timestamp: Date.now() },
    { id: 'c2', authorName: 'Sam', text: 'Hi from Sydney! 🇦🇺', authorAvatar: '', authorId: 'u2', timestamp: Date.now() }
  ]);
  const [giftAnimation, setGiftAnimation] = useState<{gift: Gift, id: number} | null>(null);

  const handleSendGift = (gift: Gift) => {
    setShowGiftSelector(false);
    // Add animation
    setGiftAnimation({ gift, id: Date.now() });
    // Add comment
    const newComment: Comment = {
      id: `gc_${Date.now()}`,
      authorName: 'You',
      text: `Sent a ${gift.name} ${gift.icon}`,
      authorAvatar: MOCK_USER.avatar,
      authorId: MOCK_USER.id,
      timestamp: Date.now()
    };
    setComments(prev => [...prev, newComment]);
    
    setTimeout(() => setGiftAnimation(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-full w-full">
       {/* Video Background */}
       <img src={stream.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
       
       {/* Gradient Overlays */}
       <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

       {/* UI Layer */}
       <div className="relative flex-1 flex flex-col p-4 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mt-2">
             <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full p-1 pr-4 border border-white/10">
                <img src={stream.streamerAvatar} className="w-9 h-9 rounded-full border border-white/20" alt="" />
                <div>
                   <h3 className="text-sm font-bold text-white leading-none">{stream.streamerName}</h3>
                   <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-white/80">{stream.viewers} watching</span>
                   </div>
                </div>
             </div>
             <button onClick={onClose} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/10 border border-white/10">
                <X className="w-6 h-6" />
             </button>
          </div>

          {/* Gift Animation Area */}
          <div className="flex-1 flex items-center justify-center pointer-events-none">
             {giftAnimation && (
               <div className="animate-fade-in flex flex-col items-center">
                  <div className="text-8xl animate-bounce">{giftAnimation.gift.icon}</div>
                  <div className="text-brand-yellow font-black text-2xl drop-shadow-lg mt-2">{giftAnimation.gift.name}</div>
               </div>
             )}
          </div>

          {/* Chat Area */}
          <div className="h-48 overflow-y-auto mask-image-t fade-mask-t space-y-2 mb-4 no-scrollbar">
             {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2 animate-slide-up">
                   <div className="font-bold text-white/60 text-sm whitespace-nowrap">{c.authorName}:</div>
                   <div className="text-white text-sm">{c.text}</div>
                </div>
             ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-4">
             <div className="flex-1 bg-black/40 backdrop-blur-md rounded-full h-12 flex items-center px-4 border border-white/10">
                <input type="text" placeholder="Say something..." className="bg-transparent border-none text-white w-full focus:outline-none placeholder-white/50 text-sm" />
             </div>
             <button onClick={() => setShowGiftSelector(true)} className="w-12 h-12 rounded-full bg-brand-yellow text-black flex items-center justify-center shadow-glow-cyber hover:scale-110 transition-transform">
                <GiftIcon className="w-6 h-6" />
             </button>
             <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-white/20">
                 <Heart className="w-6 h-6" />
             </button>
          </div>
       </div>

       {showGiftSelector && <GiftSelector onClose={() => setShowGiftSelector(false)} onSelect={handleSendGift} />}
    </div>
  );
};

// --- New Feature Components ---

const SettingsModal = ({ onClose, onSignOut }: { onClose: () => void, onSignOut: () => void }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-brand-blue' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
             <Settings className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
        </div>

        {/* Account */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">Account</h3>
          <div className="space-y-2">
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
               <div className="flex items-center gap-3">
                 <PhoneIcon className="w-5 h-5 text-white/70" />
                 <span className="text-white font-medium">+1 (555) •••-0000</span>
               </div>
               <button className="text-xs text-brand-blue font-bold hover:underline">Change</button>
             </div>
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
               <div className="flex items-center gap-3">
                 <Mail className="w-5 h-5 text-white/70" />
                 <span className="text-white font-medium">Link Email</span>
               </div>
               <button className="text-xs text-brand-blue font-bold hover:underline">Add</button>
             </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">Notifications</h3>
          <div className="bg-white/5 rounded-2xl overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-white/5">
               <div className="flex items-center gap-3">
                 <BellRing className="w-5 h-5 text-white/70" />
                 <span className="text-white font-medium">Push Notifications</span>
               </div>
               <Toggle checked={pushEnabled} onChange={setPushEnabled} />
             </div>
             <div className="flex items-center justify-between p-4">
               <div className="flex items-center gap-3">
                 <Mail className="w-5 h-5 text-white/70" />
                 <span className="text-white font-medium">Email Updates</span>
               </div>
               <Toggle checked={emailEnabled} onChange={setEmailEnabled} />
             </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">Privacy</h3>
          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <EyeOff className="w-5 h-5 text-white/70" />
               <div>
                 <p className="text-white font-medium">Ghost Mode</p>
                 <p className="text-xs text-brand-subtext">Browse profiles anonymously</p>
               </div>
             </div>
             <Toggle checked={ghostMode} onChange={setGhostMode} />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={onSignOut} className="w-full py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
          <button className="w-full py-4 rounded-xl text-red-500/80 font-bold hover:text-red-500 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-5 h-5" /> Delete Account
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-brand-subtext">
          Version 1.0.4 (Build 20240315)
        </div>

      </div>
    </div>
  );
};

const VerificationModal = ({ onClose }: { onClose: () => void }) => {
  const steps = [
    { id: 1, title: 'Phone Verified', icon: Phone, status: 'completed' },
    { id: 2, title: 'Photo Verification', icon: Camera, status: 'completed' },
    { id: 3, title: 'ID Verification (KYC)', icon: ShieldCheck, status: 'pending' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
             <BadgeCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Status</h2>
          <p className="text-brand-subtext">Complete all steps to unlock premium features and the Verified badge.</p>
        </div>

        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {index !== steps.length - 1 && (
                <div className={`absolute top-10 left-6 w-0.5 h-6 ${step.status === 'completed' ? 'bg-green-500' : 'bg-white/10'}`}></div>
              )}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                step.status === 'completed' 
                ? 'bg-green-500/10 border-green-500/30' 
                : step.status === 'pending'
                  ? 'bg-white/5 border-white/10'
                  : 'opacity-50'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  step.status === 'completed' ? 'bg-green-500 text-black' : 'bg-white/10 text-white'
                }`}>
                  {step.status === 'completed' ? <Check className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-brand-subtext">
                    {step.status === 'completed' ? 'Verified' : step.status === 'pending' ? 'Required for withdrawals' : 'Locked'}
                  </p>
                </div>
                {step.status === 'pending' && (
                  <button className="px-3 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue/80">
                    Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20">
           <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
              <p className="text-xs text-brand-blue/90 leading-relaxed">
                ID Verification is processed securely by our partner. Your data is never shared with other users.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => {
  const faqs = [
    { q: "How do I get more matches?", a: "Complete your profile, add high-quality photos, and use the 'Gift to Chat' feature to stand out!" },
    { q: "Is DearX free to use?", a: "Yes! Creating a profile and swiping is free. Sending gifts and premium features require Gems." },
    { q: "How does the 'Real' badge work?", a: "Users must complete photo verification by mimicking a gesture to prove they are real." },
    { q: "How can I withdraw my earnings?", a: "Go to your Wallet, tap 'Withdraw', and link your bank account. Minimum withdrawal is $50." },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
             <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Help & Support</h2>
        </div>

        <div className="space-y-3 mb-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 open:bg-white/10 transition-all">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-white text-sm">
                {faq.q}
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-brand-subtext" />
              </summary>
              <div className="px-4 pb-4 text-sm text-brand-subtext leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-white/10 mb-4">
           <h3 className="font-bold text-white mb-1">Still need help?</h3>
           <p className="text-xs text-brand-subtext mb-3">Our support team is available 24/7.</p>
           <Button variant="primary" className="h-10 text-sm">Contact Support</Button>
        </div>
      </div>
    </div>
  );
};

const FilterModal = ({ 
  currentFilters, 
  onApply, 
  onClose 
}: { 
  currentFilters: FilterState, 
  onApply: (filters: FilterState) => void, 
  onClose: () => void 
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Discovery Settings</h2>
          <p className="text-brand-subtext text-sm">Find exactly who you're looking for.</p>
        </div>

        {/* Distance */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-blue" /> Maximum Distance</span>
            <span className="text-brand-blue font-bold">{filters.maxDistance}km</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={filters.maxDistance} 
            onChange={(e) => setFilters({...filters, maxDistance: parseInt(e.target.value)})}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-blue"
          />
        </div>

        {/* Gender */}
        <div className="mb-6">
          <span className="text-white font-bold mb-3 block">Show Me</span>
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'Everyone' },
              { id: 'male', label: 'Men' },
              { id: 'female', label: 'Women' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilters({...filters, gender: opt.id as any})}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  filters.gender === opt.id 
                  ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                  : 'text-brand-subtext hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-bold">Age Range</span>
            <span className="text-brand-subtext">{filters.ageRange[0]} - {filters.ageRange[1]}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-brand-subtext mb-1 block">Min Age</label>
              <input 
                type="number" 
                value={filters.ageRange[0]}
                min="18"
                max={filters.ageRange[1]}
                onChange={(e) => setFilters({...filters, ageRange: [parseInt(e.target.value), filters.ageRange[1]]})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-brand-subtext mb-1 block">Max Age</label>
              <input 
                type="number" 
                value={filters.ageRange[1]}
                min={filters.ageRange[0]}
                max="100"
                onChange={(e) => setFilters({...filters, ageRange: [filters.ageRange[0], parseInt(e.target.value)]})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        <Button onClick={() => onApply(filters)} variant="primary">
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

const ReportModal = ({ 
  onClose, 
  userName,
  targetContentId 
}: { 
  onClose: () => void, 
  userName: string,
  targetContentId?: string // Optional ID if reporting specific content
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [blockUser, setBlockUser] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons: { id: ReportReason; label: string }[] = [
    { id: 'inappropriate_content', label: 'Inappropriate Content' },
    { id: 'harassment', label: 'Harassment or Bullying' },
    { id: 'fake_profile', label: 'Fake Profile' },
    { id: 'spam', label: 'Spam or Scam' },
    { id: 'other', label: 'Other' }
  ];

  const handleSubmit = () => {
    if (!selectedReason) return;
    setSubmitted(true);
    // Mock API call simulation
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-slide-up">
           <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
             <Check className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Report Received</h3>
           <p className="text-brand-subtext mb-4">
             Thank you for keeping our community safe. We will review this within 24 hours.
             {blockUser && <span className="block mt-2 text-red-400">User has been blocked.</span>}
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
             <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Report {userName}</h2>
          <p className="text-brand-subtext text-sm mt-1">
            {targetContentId ? 'Reporting specific content.' : 'Select a reason for reporting this user.'}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {reasons.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReason(r.id)}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                selectedReason === r.id 
                ? 'bg-red-500/20 border border-red-500 text-white' 
                : 'bg-white/5 border border-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Block Toggle */}
        <div className="flex items-center gap-3 mb-6 px-2">
            <button 
              onClick={() => setBlockUser(!blockUser)}
              className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${blockUser ? 'bg-red-500 border-red-500' : 'border-white/30 bg-transparent'}`}
            >
              {blockUser && <Check className="w-4 h-4 text-white" />}
            </button>
            <span className="text-sm text-white/90">Also block this user</span>
        </div>

        <Button 
          variant={selectedReason ? 'primary' : 'secondary'} 
          className={selectedReason ? 'bg-red-500 shadow-glow-vibe border-red-400' : ''}
          onClick={handleSubmit}
          disabled={!selectedReason}
        >
          Submit Report
        </Button>
      </div>
    </div>
  );
};

const TopUpModal = ({ onClose }: { onClose: () => void }) => {
  const packages = [
    { gems: 100, price: '$1.99', bonus: null },
    { gems: 550, price: '$9.99', bonus: '10%' },
    { gems: 1200, price: '$19.99', bonus: '20%', popular: true },
    { gems: 3200, price: '$49.99', bonus: '25%' },
    { gems: 6500, price: '$99.99', bonus: '30%' },
    { gems: 13500, price: '$199.99', bonus: '35%' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white italic">GET GEMS</h2>
          <p className="text-brand-subtext">Fuel your vibe. Send gifts. Rank up.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {packages.map((pkg, i) => (
            <button key={i} className={`relative p-4 h-full rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${pkg.popular ? 'bg-brand-blue/20 border-brand-blue shadow-glow-vibe backdrop-blur-sm' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              {pkg.popular && <div className="absolute -top-3 bg-brand-yellow text-black text-[10px] font-bold px-2 py-0.5 rounded-full">BEST VALUE</div>}
              {pkg.bonus && <div className="absolute top-2 right-2 text-[10px] text-green-400 font-bold">+{pkg.bonus}</div>}
              <Gem className={`w-8 h-8 ${pkg.popular ? 'text-brand-blue' : 'text-white/80'}`} />
              <div className="text-xl font-black text-white">{pkg.gems}</div>
              <div className="text-sm text-brand-subtext">{pkg.price}</div>
            </button>
          ))}
        </div>

        <Button variant="cyber">Purchase Selected</Button>
        
        {/* Compliance Footer */}
        <div className="mt-6 flex flex-col items-center gap-2">
            <button className="text-sm font-bold text-white/80 hover:text-white py-2">
                Restore Purchases
            </button>
            <div className="flex gap-4 text-[10px] text-brand-subtext">
                <button className="hover:text-white">Terms of Service</button>
                <button className="hover:text-white">Privacy Policy</button>
            </div>
            <p className="text-[9px] text-brand-subtext/50 text-center mt-2 px-4">
                Payments will be charged to your iTunes Account at confirmation of purchase. Subscriptions automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period.
            </p>
        </div>
      </div>
    </div>
  );
};

const MomentsFeed = () => {
    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-20">
            {/* Create Post Bar */}
            <div className="flex items-center gap-3 p-4 glass-card rounded-2xl">
                <img src={MOCK_USER.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-brand-blue" alt="" />
                <div className="flex-1 bg-white/5 rounded-full h-10 flex items-center px-4 text-brand-subtext text-sm hover:bg-white/10 transition-colors cursor-text">
                    Share your vibe...
                </div>
                <button className="p-2 text-brand-blue hover:bg-white/5 rounded-full transition-colors"><ImageIcon className="w-5 h-5" /></button>
            </div>

            {/* Posts */}
            {MOCK_POSTS.map(post => (
                <div key={post.id} className="glass-card rounded-3xl overflow-hidden transition-all hover:border-white/20">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <img src={post.authorAvatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                            <div>
                                <h3 className="font-bold text-white text-sm">{post.authorName}</h3>
                                <p className="text-xs text-brand-subtext">2 hours ago</p>
                            </div>
                        </div>
                        <button className="text-brand-subtext hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>

                    {/* Image */}
                    {post.image && (
                        <div className="w-full aspect-square bg-black/50 relative">
                            <img src={post.image} className="w-full h-full object-cover" alt="" />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between px-4 pt-4">
                        <div className="flex items-center gap-4">
                            <button className={`flex items-center gap-1.5 ${post.isLiked ? 'text-brand-blue' : 'text-white/80 hover:text-white'}`}>
                                <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                                <span className="font-bold text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-white/80 hover:text-white">
                                <MessageCircle className="w-6 h-6" />
                                <span className="font-bold text-sm">{post.comments}</span>
                            </button>
                            <button className="text-white/80 hover:text-white">
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                        <button className="text-brand-subtext hover:text-brand-yellow transition-colors">
                            <GiftIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Caption */}
                    <div className="p-4">
                        <p className="text-sm text-white/90 leading-relaxed">
                            <span className="font-bold mr-2">{post.authorName}</span>
                            {post.content}
                        </p>
                        {post.commentsList && post.commentsList.length > 0 && (
                            <div className="mt-3 text-xs text-brand-subtext">
                                View all {post.comments} comments
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ChatRoomView = ({ 
    chat, 
    onBack,
    onReportMessage 
}: { 
    chat: ChatSession, 
    onBack: () => void,
    onReportMessage: (msgId: string) => void
}) => {
    const [msgText, setMsgText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat.messages]);

    return (
        <div className="flex flex-col h-full bg-[#12122A]">
            {/* Chat Header */}
            <div className="h-16 shrink-0 glass-nav px-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-white/80 hover:text-white rounded-full hover:bg-white/10">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="relative">
                        <img src={chat.partnerAvatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#12122A]"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-tight">{chat.partnerName}</h3>
                        <p className="text-xs text-brand-subtext flex items-center gap-1">Online <span className="w-1 h-1 bg-green-500 rounded-full"></span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-brand-blue bg-brand-blue/10 rounded-full hover:bg-brand-blue/20 transition-colors"><Phone className="w-5 h-5" /></button>
                    <button className="p-2 text-brand-purple bg-brand-purple/10 rounded-full hover:bg-brand-purple/20 transition-colors"><Video className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                <div className="text-center text-xs text-brand-subtext my-4 glass-pill inline-block px-3 py-1 rounded-full mx-auto">Today 10:23 AM</div>
                
                {/* System Message / Gift */}
                <div className="flex justify-center my-4">
                    <div className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1 border border-white/10">
                        <div className="bg-brand-yellow/20 p-2 rounded-full mb-1">
                            <GiftIcon className="w-4 h-4 text-brand-yellow" />
                        </div>
                        <p className="text-xs text-brand-subtext">You sent a <span className="text-brand-yellow font-bold">Coffee ☕</span></p>
                    </div>
                </div>

                {/* Messages */}
                {chat.messages.map((msg) => {
                    const isMe = msg.senderId === CURRENT_USER_ID;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
                            {/* Report Button for received messages */}
                            {!isMe && (
                                <button 
                                  onClick={() => onReportMessage(msg.id)}
                                  className="mb-2 p-1.5 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Report this message"
                                >
                                    <Flag className="w-3 h-3" />
                                </button>
                            )}

                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                isMe 
                                ? 'bg-vibe-gradient text-white rounded-tr-none shadow-glow-vibe' 
                                : 'glass-card text-white rounded-tl-none border-white/5'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-4 pb-8 glass-nav">
                <div className="flex items-center gap-3">
                    <button className="text-brand-yellow hover:scale-110 transition-transform">
                        <GiftIcon className="w-7 h-7" />
                    </button>
                    <div className="flex-1 bg-white/5 rounded-full border border-white/10 flex items-center px-2 focus-within:bg-white/10 transition-colors">
                        <input 
                            type="text" 
                            value={msgText}
                            onChange={(e) => setMsgText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none text-white px-3 py-3 focus:outline-none placeholder-white/30"
                        />
                        <button className="p-2 text-white/50 hover:text-white"><Sticker className="w-5 h-5" /></button>
                    </div>
                    {msgText ? (
                        <button className="p-3 bg-brand-blue rounded-full text-white shadow-lg animate-fade-in">
                            <Send className="w-5 h-5" />
                        </button>
                    ) : (
                        <button className="p-3 text-white/50 hover:text-white">
                            <Mic className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Swipe View Components ---

interface SwipeableCardRef {
  triggerSwipe: (direction: 'left' | 'right') => Promise<void>;
}

const SwipeableCard = forwardRef<SwipeableCardRef, { 
  profile: User; 
  onSwipe: (direction: 'left' | 'right') => void;
  onInfoClick: () => void;
}>(({ profile, onSwipe, onInfoClick }, ref) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [swipeResult, setSwipeResult] = useState<'like' | 'nope' | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Reset photo index when profile changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [profile.id]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (direction) => {
      const x = direction === 'right' ? 1000 : -1000;
      const rot = direction === 'right' ? 20 : -20;
      setOffset({ x, y: 0 });
      setRotation(rot);
      setSwipeResult(direction === 'right' ? 'like' : 'nope');
      await new Promise(r => setTimeout(r, 300));
      onSwipe(direction);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setSwipeResult(null);
    }
  }));

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    startPos.current = { x: clientX, y: clientY };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    setOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.05);

    if (deltaX > 100) setSwipeResult('like');
    else if (deltaX < -100) setSwipeResult('nope');
    else setSwipeResult(null);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(false);
    
    // Check if it's a tap (little to no movement)
    const moveX = Math.abs(offset.x);
    const moveY = Math.abs(offset.y);
    
    if (moveX < 5 && moveY < 5) {
      // Logic for Tap Navigation
      const clientX = 'changedTouches' in e 
          ? e.changedTouches[0].clientX 
          : (e as React.MouseEvent).clientX;

      if (cardRef.current) {
        const { left, width } = cardRef.current.getBoundingClientRect();
        const tapX = clientX - left;
        
        if (tapX < width / 2) {
          // Tap Left -> Prev Photo
          setPhotoIndex(prev => Math.max(0, prev - 1));
        } else {
          // Tap Right -> Next Photo
          setPhotoIndex(prev => Math.min(profile.photos.length - 1, prev + 1));
        }
      }

      // Reset any slight offset
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setSwipeResult(null);
      return;
    }

    // Swipe Logic
    if (Math.abs(offset.x) > 150) {
      const direction = offset.x > 0 ? 'right' : 'left';
      setOffset({ x: offset.x > 0 ? 1000 : -1000, y: 0 });
      setTimeout(() => {
        onSwipe(direction);
        setOffset({ x: 0, y: 0 });
        setRotation(0);
        setSwipeResult(null);
      }, 300);
    } else {
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setSwipeResult(null);
    }
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full flex items-center justify-center p-4 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div 
        ref={cardRef}
        className="w-full h-full relative rounded-3xl overflow-hidden shadow-float pointer-events-auto transition-transform duration-100 ease-out bg-[#1C1C33]"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${isDragging ? 1.05 : 1})`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Photo Navigation Indicators */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
          {profile.photos.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === photoIndex ? 'bg-white' : 'bg-white/30'
              }`} 
            />
          ))}
        </div>

        <img 
          src={profile.photos[photoIndex]} 
          alt={profile.name}
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 pointer-events-none" />
        
        {/* Status Stamps */}
        {swipeResult === 'like' && (
          <div className="absolute top-10 left-10 rotate-[-20deg] border-4 border-brand-blue text-brand-blue px-4 py-2 rounded-xl text-4xl font-black tracking-widest bg-brand-dark/20 backdrop-blur-sm z-20 shadow-[0_0_20px_rgba(46,92,255,0.5)]">
            LIKE
          </div>
        )}
        {swipeResult === 'nope' && (
          <div className="absolute top-10 right-10 rotate-[20deg] border-4 border-red-500 text-red-500 px-4 py-2 rounded-xl text-4xl font-black tracking-widest bg-brand-dark/20 backdrop-blur-sm z-20 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            NOPE
          </div>
        )}

        {/* Info Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-6 text-white pointer-events-none">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold drop-shadow-lg">{profile.name}, {profile.age}</h2>
                {/* Real Person Verification Mark */}
                {profile.isVerified && (
                  <div className="flex items-center gap-1 bg-brand-blue/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20 shadow-[0_0_15px_rgba(46,92,255,0.5)] ml-1">
                     <BadgeCheck className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                     <span className="text-[10px] font-bold text-white uppercase tracking-wider">Real</span>
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
                  className="glass-pill p-1.5 rounded-full hover:bg-white/20 transition-colors ml-1 pointer-events-auto"
                >
                  <Info className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-white/90 mb-3 drop-shadow-md">
                <div className="flex items-center gap-1 glass-pill px-2 py-0.5 rounded-lg">
                   <MapPin className="w-3 h-3" />
                   <span className="text-sm font-medium">{profile.distance}</span>
                </div>
                {profile.job && (
                  <div className="flex items-center gap-1 glass-pill px-2 py-0.5 rounded-lg">
                    <Briefcase className="w-3 h-3" />
                    <span className="text-sm font-medium">{profile.job}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-white/80 line-clamp-2 text-sm drop-shadow-md leading-relaxed mt-2 font-medium">
            {profile.bio}
          </p>
        </div>
      </div>
    </div>
  );
});

// --- Main Views ---

const LoginView = ({ onLogin }: { onLogin: () => void }) => {
  const [step, setStep] = useState<AuthStep>('login');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      
      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* LOGO */}
        <div className="flex flex-col items-center mb-12 animate-fade-in">
           <h1 className="text-5xl font-black text-white tracking-[0.3em] leading-none drop-shadow-2xl">DEAR</h1>
           <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-blue to-brand-purple leading-none -mt-4 drop-shadow-2xl filter">X</h1>
        </div>

        <p className="text-brand-subtext text-center mb-10 text-lg font-medium">Connect. Gift. Vibe.</p>
        
        {step === 'login' && (
          <div className="w-full space-y-4 animate-slide-up">
            <Button onClick={() => setStep('phone-input')} variant="primary" icon={Smartphone} className="shadow-glow-vibe">
              Continue with Phone
            </Button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="glass-pill px-2 text-brand-subtext">Or</span></div>
            </div>
            <Button onClick={onLogin} variant="white" className="border-none">
              <span className="font-bold"></span> Continue with Apple
            </Button>
            <Button onClick={onLogin} variant="secondary" className="bg-slate-800 border border-slate-700">
              <span className="font-bold text-blue-400">G</span> Continue with Google
            </Button>
            
            {/* EULA & Safety Disclaimer */}
            <p className="text-[10px] text-center text-white/30 mt-8 max-w-xs mx-auto leading-relaxed">
                By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>. 
                <br /><br />
                <strong>DearX has a zero-tolerance policy</strong> for objectionable content or abusive users. 
                Violators will be permanently banned.
            </p>
          </div>
        )}

        {step === 'phone-input' && (
          <div className="w-full space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-center mb-4">What's your number?</h2>
            <input 
              type="tel" 
              placeholder="+1 (555) 000-0000" 
              className="w-full glass-card rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all placeholder-white/20"
            />
            <p className="text-xs text-brand-subtext text-center">We'll send you a code. Standard rates may apply.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button onClick={() => setStep('login')} variant="ghost">Back</Button>
              <Button onClick={() => setStep('otp-input')} variant="primary">Next</Button>
            </div>
          </div>
        )}

        {step === 'otp-input' && (
          <div className="w-full space-y-4 animate-slide-up">
             <h2 className="text-xl font-bold text-center mb-2">Enter Code</h2>
             <p className="text-brand-subtext text-center text-sm mb-4">Sent to +1 (555) 000-0000</p>
             <div className="flex gap-2 justify-center mb-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-12 h-14 glass-card rounded-xl flex items-center justify-center text-2xl font-bold border-white/20">
                   {i === 1 ? '5' : ''}
                 </div>
               ))}
             </div>
             <Button onClick={onLogin} variant="primary">Verify & Login</Button>
             <Button onClick={() => setStep('phone-input')} variant="ghost" className="text-sm">Wrong number?</Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SwipeView = ({ 
  profiles, 
  onStartChat, 
  onTriggerSwipe,
  onInfoClick
}: { 
  profiles: User[], 
  onStartChat: (profile: User) => void,
  onTriggerSwipe: (direction: 'left' | 'right') => void,
  onInfoClick: (profile: User) => void
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef<SwipeableCardRef>(null);

  // Force reset index when profiles list changes (due to filtering)
  useEffect(() => {
    setCurrentIndex(0);
  }, [profiles]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
        onTriggerSwipe('right'); // Trigger global like logic
    }
    setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
    }, 200);
  };

  const handleTrigger = (direction: 'left' | 'right') => {
    cardRef.current?.triggerSwipe(direction);
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
           <Search className="w-10 h-10 text-brand-subtext" />
        </div>
        <h2 className="text-2xl font-bold mb-2">That's everyone!</h2>
        <p className="text-brand-subtext mb-8">Check back later or adjust your filters.</p>
        <Button onClick={() => setCurrentIndex(0)} variant="outline" icon={RotateCcw}>
          Start Over
        </Button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Cards Area */}
      <div className="flex-1 relative w-full overflow-hidden">
        {/* Background Card (Next Profile) */}
        {currentIndex + 1 < profiles.length && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
             <div className="w-full h-full bg-[#1C1C33] rounded-3xl opacity-50 scale-95 border border-white/5">
                <img 
                  src={profiles[currentIndex + 1].photos[0]} 
                  className="w-full h-full object-cover rounded-3xl grayscale opacity-30" 
                  alt="" 
                />
             </div>
          </div>
        )}
        
        {/* Active Card */}
        <SwipeableCard 
          key={currentProfile.id}
          ref={cardRef}
          profile={currentProfile}
          onSwipe={handleSwipe}
          onInfoClick={() => onInfoClick(currentProfile)} 
        />
      </div>

      {/* Static Action Bar Footer */}
      <div className="h-24 px-6 pb-4 flex items-center justify-center gap-6 z-20 shrink-0">
          {/* Dislike */}
          <button 
             onClick={() => handleTrigger('left')}
             className="w-14 h-14 rounded-full glass-card border border-white/10 text-red-500 flex items-center justify-center shadow-lg hover:bg-red-500/10 hover:scale-110 transition-all"
          >
             <X className="w-7 h-7" strokeWidth={3} />
          </button>

          {/* Super Gift (Start Chat) */}
          <button 
             onClick={() => onStartChat(currentProfile)}
             className="w-20 h-20 rounded-full bg-cyber-gradient text-black flex items-center justify-center shadow-glow-cyber hover:scale-105 transition-all relative group"
          >
             <GiftIcon className="w-10 h-10 group-hover:animate-bounce" />
             <div className="absolute -bottom-8 bg-brand-yellow/10 text-brand-yellow text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-yellow/20 opacity-0 group-hover:opacity-100 transition-opacity">
               SEND GIFT
             </div>
          </button>

          {/* Like */}
          <button 
             onClick={() => handleTrigger('right')}
             className="w-14 h-14 rounded-full glass-card border border-white/10 text-brand-blue flex items-center justify-center shadow-lg hover:bg-brand-blue/10 hover:scale-110 transition-all"
          >
             <ThumbsUp className="w-7 h-7 fill-current" />
          </button>
      </div>
    </div>
  );
};

const DiscoverView = ({ 
  leaderboardData,
  onOpenStream
}: { 
  leaderboardData: LeaderboardUser[],
  onOpenStream: (stream: LiveStream) => void
}) => {
  const [activeTab, setActiveTab] = useState<'moments' | 'live' | 'ranking'>('ranking');
  const [rankingTab, setRankingTab] = useState<'income' | 'popular'>('popular');

  const getRankStyle = (rank: number) => {
      switch(rank) {
          case 1: return { color: 'text-yellow-400', border: 'border-yellow-400', glow: 'shadow-glow-cyber', icon: <Crown className="w-6 h-6 fill-yellow-400 text-yellow-400 absolute -top-4" /> };
          case 2: return { color: 'text-gray-300', border: 'border-gray-300', glow: '', icon: null };
          case 3: return { color: 'text-amber-600', border: 'border-amber-600', glow: '', icon: null };
          default: return { color: 'text-white', border: 'border-white/10', glow: '', icon: null };
      }
  };

  // Top 3 for Podium
  const top3 = leaderboardData.slice(0, 3);
  // Rest of the list
  const restList = leaderboardData.slice(3);

  // Reorder top 3 for display: 2, 1, 3
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* Discover Tabs */}
      <div className="px-4 py-2 shrink-0">
         <div className="flex p-1 glass-card rounded-2xl border border-white/5">
            {['moments', 'live', 'ranking'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all capitalize ${
                        activeTab === tab 
                        ? 'bg-vibe-gradient text-white shadow-lg' 
                        : 'text-brand-subtext hover:text-white'
                    }`}
                >
                    {tab}
                </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar space-y-4">
        {activeTab === 'ranking' && (
            <div className="animate-fade-in space-y-6">
                
                {/* Income/Popular Toggle */}
                <div className="flex justify-center gap-4">
                     <button 
                        onClick={() => setRankingTab('popular')}
                        className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${
                            rankingTab === 'popular' 
                            ? 'bg-brand-blue/20 border-brand-blue text-brand-blue shadow-[0_0_15px_rgba(46,92,255,0.3)] backdrop-blur-sm' 
                            : 'bg-transparent border-white/10 text-brand-subtext'
                        }`}
                     >
                        🔥 Popularity
                     </button>
                     <button 
                        onClick={() => setRankingTab('income')}
                        className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${
                            rankingTab === 'income' 
                            ? 'bg-brand-yellow/20 border-brand-yellow text-brand-yellow shadow-[0_0_15px_rgba(255,211,0,0.3)] backdrop-blur-sm' 
                            : 'bg-transparent border-white/10 text-brand-subtext'
                        }`}
                     >
                        💰 Income
                     </button>
                </div>
                
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-brand-subtext flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Within 500km
                    </span>
                    <span className="text-xs text-brand-subtext">Resets in 14h</span>
                </div>

                {/* Podium */}
                <div className="flex justify-center items-end gap-4 pt-12 pb-4 relative h-64">
                    {/* Background Glow */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-40 bg-brand-blue/20 blur-[60px] rounded-full pointer-events-none"></div>

                    {podiumOrder.map((user, index) => {
                         const isFirst = user.rank === 1;
                         const isSecond = user.rank === 2;
                         const isThird = user.rank === 3;
                         const style = getRankStyle(user.rank);
                         
                         return (
                            <div key={user.id} className={`flex flex-col items-center z-10 relative transition-all duration-500
                                ${isFirst ? 'order-2 mb-10 scale-110' : ''} 
                                ${isSecond ? 'order-1 mb-4' : ''} 
                                ${isThird ? 'order-3 mb-0 scale-95' : ''}
                            `}>
                                {/* Crown for #1 */}
                                {isFirst && (
                                    <div className="absolute -top-10 animate-bounce">
                                        <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-glow-cyber" />
                                    </div>
                                )}
                                
                                <div className="relative mb-2">
                                    <div className={`rounded-full p-[3px] shadow-2xl ${
                                        isFirst ? 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-yellow-500/50' : 
                                        isSecond ? 'bg-gradient-to-b from-slate-300 to-slate-500 shadow-slate-400/50' : 
                                        'bg-gradient-to-b from-amber-600 to-amber-800 shadow-amber-600/50'
                                    }`}>
                                        <img 
                                            src={user.avatar} 
                                            alt={user.name} 
                                            className={`rounded-full object-cover border-4 border-[#12122A] ${isFirst ? 'w-28 h-28' : 'w-20 h-20'}`}
                                        />
                                    </div>
                                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-4 border-[#12122A] ${
                                        isFirst ? 'bg-yellow-400 text-black' : 
                                        isSecond ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                                    }`}>
                                        {user.rank}
                                    </div>
                                </div>
                                <h3 className={`font-bold mt-3 ${isFirst ? 'text-xl' : 'text-sm'} text-white`}>{user.name}</h3>
                                <div className={`font-black flex items-center gap-1 ${rankingTab === 'popular' ? 'text-brand-blue' : 'text-brand-yellow'}`}>
                                    {rankingTab === 'popular' && <Flame className="w-3 h-3 fill-current" />}
                                    {user.value}
                                </div>
                            </div>
                         );
                    })}
                </div>

                {/* List */}
                <div className="space-y-2 pb-20">
                    {restList.map((user) => (
                        <div key={user.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                            <span className="w-6 text-center font-bold text-brand-subtext">{user.rank}</span>
                            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-white">{user.name}</h4>
                            </div>
                            <div className={`font-bold text-sm ${rankingTab === 'popular' ? 'text-brand-blue' : 'text-brand-yellow'}`}>
                                {user.value}
                            </div>
                            {user.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400" />}
                            {user.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-400" />}
                            {user.trend === 'same' && <Minus className="w-4 h-4 text-gray-500" />}
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {activeTab === 'moments' && <MomentsFeed />}

        {activeTab === 'live' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {MOCK_LIVESTREAMS.map(stream => (
                    <div key={stream.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer" onClick={() => onOpenStream(stream)}>
                        <img src={stream.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
                        <div className="absolute top-2 right-2 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-sm font-bold text-white line-clamp-1">{stream.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <img src={stream.streamerAvatar} className="w-4 h-4 rounded-full" alt="" />
                                <span className="text-xs text-white/80">{stream.streamerName}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const WalletView = ({ onTopUp }: { onTopUp: () => void }) => {
  const incomeData = [
    { day: 'Mon', amount: 45 },
    { day: 'Tue', amount: 132 },
    { day: 'Wed', amount: 88 },
    { day: 'Thu', amount: 210 },
    { day: 'Fri', amount: 185 },
    { day: 'Sat', amount: 340 },
    { day: 'Sun', amount: 290 },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6 pb-24">
        <div className="w-full h-48 rounded-3xl bg-vibe-gradient relative overflow-hidden p-6 flex flex-col justify-between shadow-glow-vibe shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-white/80 font-medium mb-1">Total Balance</p>
              <h2 className="text-4xl font-black text-white">$1,240.50</h2>
            </div>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex gap-3 z-10">
             <button className="flex-1 bg-brand-yellow text-black py-2.5 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition-all">
               Withdraw
             </button>
             <button onClick={onTopUp} className="flex-1 bg-white/20 text-white py-2.5 rounded-xl font-bold text-sm backdrop-blur-md border border-white/10 hover:bg-white/30 transition-all">
               Top Up
             </button>
          </div>
        </div>

        {/* Updated Padding to p-6 to align with other cards */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shrink-0">
           <div className="flex items-center justify-between mb-6">
               <div>
                   {/* Updated to text-lg to align with Recent Transactions header */}
                   <h3 className="font-bold text-lg text-white flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-brand-yellow" />
                       Income Trend
                   </h3>
               </div>
               <div className="flex gap-2">
                   <span className="text-xs font-bold bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded-xl border border-brand-yellow/20">Weekly</span>
               </div>
           </div>
           
           <div className="h-32 w-full">
               <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={incomeData}>
                       <defs>
                           <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#FFD300" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#FFD300" stopOpacity={0}/>
                           </linearGradient>
                       </defs>
                       <Tooltip 
                           cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }}
                           contentStyle={{ 
                               backgroundColor: 'rgba(18, 18, 42, 0.95)', 
                               borderColor: 'rgba(255, 255, 255, 0.1)', 
                               borderRadius: '16px',
                               padding: '12px 16px',
                               boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                           }}
                           itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}
                           labelStyle={{ color: '#94A3B8', fontSize: '12px', fontWeight: '500' }}
                           formatter={(value) => [`$${value}`, 'Income']}
                       />
                       <Area 
                           type="monotone" 
                           dataKey="amount" 
                           stroke="#FFD300" 
                           strokeWidth={3} 
                           fillOpacity={1} 
                           fill="url(#colorIncome)" 
                           activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                       />
                   </AreaChart>
               </ResponsiveContainer>
           </div>
        </div>

      <div className="glass-card rounded-3xl p-6 border border-white/10 shrink-0">
         <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-blue" />
            Recent Transactions
         </h3>
         <div className="space-y-3">
           {MOCK_TRANSACTIONS.map(t => (
             <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
               <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                   t.type === 'earnings' ? 'bg-green-500/20 text-green-400' : 'bg-brand-blue/20 text-brand-blue'
                 }`}>
                   {t.type === 'earnings' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                 </div>
                 <div>
                   <p className="font-bold text-white text-sm">{t.description}</p>
                   <p className="text-xs text-brand-subtext mt-0.5">{t.date}</p>
                 </div>
               </div>
               <span className={`font-bold text-sm ${t.type === 'earnings' ? 'text-green-400' : 'text-white'}`}>
                 {t.type === 'earnings' ? '+' : '-'}${t.amount}
               </span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

const ProfileView = ({ 
  user, 
  isOwnProfile = true, 
  onBack,
  onStartChat,
  onOpenSettings,
  onOpenVerification,
  onOpenHelp,
  onSignOut
}: { 
  user: User, 
  isOwnProfile?: boolean, 
  onBack?: () => void,
  onStartChat?: (user: User) => void,
  onOpenSettings?: () => void,
  onOpenVerification?: () => void,
  onOpenHelp?: () => void,
  onSignOut?: () => void
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Mock recent activity for UI
  const recentActivity = [
    { id: 1, text: "Received a Castle gift", time: "2h ago", icon: GiftIcon, color: "text-brand-yellow" },
    { id: 2, text: "Hit 10k Likes", time: "1d ago", icon: Flame, color: "text-red-500" },
    { id: 3, text: "Visited The Grounds", time: "2d ago", icon: MapPin, color: "text-green-500" },
  ];

  const menuItems = [
    { icon: Settings, label: 'Settings', color: 'bg-blue-500/10 text-blue-400', action: onOpenSettings },
    { icon: ShieldCheck, label: 'Verification', color: 'bg-green-500/10 text-green-400', action: onOpenVerification },
    { icon: HelpCircle, label: 'Help & Support', color: 'bg-purple-500/10 text-purple-400', action: onOpenHelp },
    { icon: LogOut, label: 'Sign Out', color: 'bg-red-500/10 text-red-400', action: onSignOut }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-brand-blue/20 to-transparent z-0"></div>

      {/* Top Bar for Other User */}
      {!isOwnProfile && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
           <button onClick={onBack} className="p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md">
             <ChevronLeft className="w-6 h-6" />
           </button>
           <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md">
             <MoreVertical className="w-6 h-6" />
           </button>
        </div>
      )}

      {/* Menu Dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
          <div className="absolute top-16 right-4 z-50 glass-card rounded-xl p-2 w-48 shadow-xl animate-fade-in border border-white/10">
            <button 
              onClick={() => { setShowReport(true); setShowMenu(false); }} 
              className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/5 rounded-lg font-bold flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> Report User
            </button>
            <button className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/5 rounded-lg font-bold flex items-center gap-2">
              <Ban className="w-4 h-4" /> Block User
            </button>
          </div>
        </>
      )}

      {/* Report Modal */}
      {showReport && <ReportModal userName={user.name} onClose={() => setShowReport(false)} />}

      <div className={`p-6 flex flex-col items-center relative z-10 ${!isOwnProfile ? 'mt-8' : ''}`}>
        {/* Avatar Area */}
        <div className="relative mb-4 mt-4">
           <div className="w-32 h-32 rounded-full p-1 bg-vibe-gradient shadow-[0_0_30px_rgba(46,92,255,0.4)]">
             <img src={user.avatar} className="w-full h-full rounded-full border-4 border-[#12122A] object-cover" alt="" />
           </div>
           {/* Verification Badge */}
           {user.isVerified && (
             <div className="absolute bottom-1 right-1 bg-brand-blue text-white p-1.5 rounded-full border-4 border-[#12122A] shadow-lg">
               <BadgeCheck className="w-4 h-4" strokeWidth={3} />
             </div>
           )}
        </div>

        {/* Name & ID */}
        <h2 className="text-3xl font-black text-white mb-1 drop-shadow-lg">{user.name}, {user.age}</h2>
        <div className="flex items-center gap-2 text-brand-subtext mb-6 bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
            <span className="font-mono">@{user.id}</span>
            <span>•</span>
            <MapPin className="w-3 h-3" />
            <span>Sydney, AU</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mb-8">
            {isOwnProfile ? (
              <>
                <Button variant="glass" className="flex-1 h-12 rounded-xl font-bold border-white/10 bg-white/5">
                   <PenTool className="w-4 h-4" /> Edit Profile
                </Button>
                <Button variant="primary" className="flex-1 h-12 rounded-xl font-bold shadow-glow-vibe">
                   <Share2 className="w-4 h-4" /> Share Profile
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => onStartChat && onStartChat(user)} 
                variant="cyber" // Changed to Cyber (Gift) variant
                className="flex-1 h-12 rounded-xl font-bold shadow-glow-cyber text-black"
              >
                 <GiftIcon className="w-4 h-4" /> Gift to Chat
              </Button>
            )}
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 w-full justify-between px-4 mb-8">
          {[
            { label: 'Followers', val: '1.2k' },
            { label: 'Following', val: '450' },
            { label: 'Likes', val: '8.5k' }
          ].map((stat, i) => (
             <div key={i} className="text-center flex-1 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
                <p className="text-2xl font-black text-white mb-1">{stat.val}</p>
                <p className="text-[10px] text-brand-subtext uppercase tracking-wider font-bold">{stat.label}</p>
             </div>
          ))}
        </div>

        {/* Bio Section */}
        <div className="w-full mb-6 text-left">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-blue" /> About
            </h3>
            <div className="glass-card p-4 rounded-2xl text-white/80 text-sm leading-relaxed">
                {user.bio}
            </div>
        </div>

        {/* Interests Tags */}
        <div className="w-full mb-8 text-left">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-yellow" /> Interests
            </h3>
            <div className="flex flex-wrap gap-2">
                {user.tags.map(tag => (
                    <div key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/90 hover:bg-white/10 transition-colors cursor-default">
                        #{tag}
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Activity */}
        <div className="w-full mb-8 text-left">
             <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-purple" /> Recent Activity
            </h3>
            <div className="space-y-3">
                {recentActivity.map(act => (
                    <div key={act.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 ${act.color}`}>
                            <act.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">{act.text}</p>
                            <p className="text-xs text-brand-subtext">{act.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Menu Items (Only for Own Profile) */}
        {isOwnProfile && (
          <div className="w-full space-y-3 pb-6">
            {menuItems.map((item, i) => (
              <button 
                key={i} 
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 rounded-2xl glass-card hover:bg-white/10 transition-all group"
              >
                 <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                     <item.icon className="w-5 h-5" />
                   </div>
                   <span className="font-bold text-white">{item.label}</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-brand-subtext" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatListView = ({ 
    chats, 
    friends,
    onChatSelect,
    onStartChat
}: { 
    chats: ChatSession[], 
    friends: User[],
    onChatSelect: (chat: ChatSession) => void,
    onStartChat: (user: User) => void
}) => {
    const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');

    // Create a story list from people we have chatted with
    // We determine "hasNewStory" by checking if they have posts in MOCK_POSTS
    const stories = chats.reduce((acc, chat) => {
        if (!acc.some(s => s.partnerId === chat.partnerId)) {
            acc.push({
                ...chat,
                hasNewStory: MOCK_POSTS.some(p => p.authorId === chat.partnerId)
            });
        }
        return acc;
    }, [] as (ChatSession & { hasNewStory: boolean })[]);

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 pb-2">
                 <h2 className="text-3xl font-bold text-white mb-4">Connect</h2>

                 {/* New Stories/Moments Row */}
                 <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 -mx-6 px-6 pb-2 min-h-[90px] items-start">
                     {/* My Story Placeholder */}
                     <div className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
                        <div className="relative">
                           <img src={MOCK_USER.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white/10 opacity-60" alt="Me" />
                           <div className="absolute inset-0 flex items-center justify-center">
                               <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                                   <Plus className="w-5 h-5 text-white" />
                               </div>
                           </div>
                        </div>
                        <span className="text-xs text-brand-subtext font-medium">My Story</span>
                     </div>
                     
                     {/* Chat Partners Stories */}
                     {stories.map(story => (
                         <div key={story.id} onClick={() => onChatSelect(story)} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
                             {/* The Frame: Gradient if new story, standard border if not */}
                             <div className={`relative p-[3px] rounded-full transition-all ${
                                 story.hasNewStory 
                                 ? 'bg-gradient-to-tr from-brand-blue via-brand-purple to-brand-yellow animate-pulse-slow shadow-[0_0_15px_rgba(157,70,255,0.5)]' 
                                 : 'bg-transparent border-2 border-white/5 hover:border-white/20'
                             }`}>
                                 <div className="bg-[#12122A] p-[2px] rounded-full">
                                    <img src={story.partnerAvatar} className="w-14 h-14 rounded-full object-cover" alt={story.partnerName} />
                                 </div>
                             </div>
                             <span className={`text-xs font-medium truncate w-16 text-center ${story.hasNewStory ? 'text-white' : 'text-brand-subtext'}`}>
                                 {story.partnerName}
                             </span>
                         </div>
                     ))}
                 </div>

                 <div className="flex p-1 glass-card rounded-2xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                            activeTab === 'chats' 
                            ? 'bg-vibe-gradient text-white shadow-lg' 
                            : 'text-brand-subtext hover:text-white'
                        }`}
                    >
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                            activeTab === 'friends' 
                            ? 'bg-vibe-gradient text-white shadow-lg' 
                            : 'text-brand-subtext hover:text-white'
                        }`}
                    >
                        Friends
                    </button>
                 </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar space-y-2 mt-2">
                {activeTab === 'chats' ? (
                    chats.length > 0 ? (
                        chats.map(chat => (
                            <div key={chat.id} onClick={() => onChatSelect(chat)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                <div className="relative">
                                    <img src={chat.partnerAvatar} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform" alt="" />
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1C1C33] rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-white truncate">{chat.partnerName}</h3>
                                        <span className="text-xs text-brand-subtext">2m ago</span>
                                    </div>
                                    <p className="text-brand-subtext text-sm truncate">{chat.messages[chat.messages.length-1]?.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-brand-subtext mt-10">No active chats yet.</div>
                    )
                ) : (
                    friends.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {friends.map(friend => (
                                <div key={friend.id} onClick={() => onStartChat(friend)} className="glass-card p-4 rounded-3xl flex flex-col items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors relative group">
                                    <div className="relative">
                                        <img src={friend.avatar} className="w-20 h-20 rounded-full object-cover group-hover:scale-105 transition-transform border-2 border-white/5" alt="" />
                                        {friend.isVerified && <div className="absolute bottom-0 right-0 bg-brand-blue p-1 rounded-full border-2 border-[#1C1C33]"><BadgeCheck className="w-3 h-3 text-white" /></div>}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-white">{friend.name}</h3>
                                        <p className="text-xs text-brand-subtext">Online 3m ago</p>
                                    </div>
                                    <button className="w-full py-2 rounded-xl bg-white/5 text-brand-blue text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors">
                                        Say Hi 👋
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-brand-subtext mt-10">No friends yet. Swipe to match!</div>
                    )
                )}
            </div>
        </div>
    );
};

// --- App Component ---

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'swipe' | 'discover' | 'wallet' | 'profile' | 'messages' | 'chat-room' | 'livestream' | 'kyc-upload'>('swipe');
  const [chats, setChats] = useState(MOCK_CHATS);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD_POPULARITY);
  const [showTopUp, setShowTopUp] = useState(false);
  const [activeModal, setActiveModal] = useState<'settings' | 'verification' | 'help' | null>(null);
  
  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSettings, setFilterSettings] = useState<FilterState>({
    ageRange: [18, 50],
    gender: 'all',
    maxDistance: 50
  });
  
  // Reporting State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetName, setReportTargetName] = useState('');
  const [reportTargetContentId, setReportTargetContentId] = useState<string | undefined>(undefined);

  // State for viewing another user's profile
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);

  const handleStartChat = (profile: User) => {
      // Check if chat exists
      let chat = chats.find(c => c.partnerId === profile.id);
      if (!chat) {
          // Create new chat
          const newChat: ChatSession = {
              id: `new_${Date.now()}`,
              partnerId: profile.id,
              partnerName: profile.name,
              partnerAvatar: profile.avatar,
              status: 'initial',
              createdAt: Date.now(),
              senderMessageCount: 0,
              messages: []
          };
          setChats([newChat, ...chats]);
          chat = newChat;
      }
      setActiveChat(chat);
      setView('chat-room');
  };

  const handleChatSelect = (chat: ChatSession) => {
      setActiveChat(chat);
      setView('chat-room');
  };

  const handleOpenStream = (stream: LiveStream) => {
    setActiveStream(stream);
    setView('livestream');
  };

  const handleLike = (direction: 'left' | 'right') => {
      if (direction === 'right') {
          // Simulate Heat Increase randomly for demo
          const updated = leaderboard.map(user => {
             // For demo, just increment the first user found or random
             if (Math.random() > 0.5) return user;
             const currentVal = parseInt(user.value.replace(/k|🔥|,/g, ''));
             return { ...user, value: `${currentVal + 1}k 🔥`, trend: 'up' as const };
          }).sort((a, b) => parseInt(b.value) - parseInt(a.value))
            .map((u, i) => ({ ...u, rank: i + 1 }));
          
          setLeaderboard(updated);
      }
  };

  const handleInfoClick = (profile: User) => {
    setViewingProfile(profile);
    // Use a special view state or just reuse profile view with a flag? 
    // We'll reuse 'profile' view but check viewingProfile state
    setView('profile');
  };

  const handleBackFromProfile = () => {
    setViewingProfile(null);
    setView('swipe'); // Return to swipe view (or wherever we came from, simplifying for now)
  };

  const handleReportMessage = (msgId: string) => {
    if (activeChat) {
      setReportTargetName(activeChat.partnerName);
      setReportTargetContentId(msgId);
      setShowReportModal(true);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setView('swipe');
    setActiveModal(null);
  };
  
  const parseDistance = (distStr: string) => {
    return parseInt(distStr) || 0;
  };

  const getFilteredProfiles = () => {
    return MOCK_PROFILES.filter(p => {
      const ageMatch = p.age >= filterSettings.ageRange[0] && p.age <= filterSettings.ageRange[1];
      const genderMatch = filterSettings.gender === 'all' || p.gender === filterSettings.gender;
      const distMatch = parseDistance(p.distance) <= filterSettings.maxDistance;
      return ageMatch && genderMatch && distMatch;
    });
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  // Header Logic
  const renderHeader = () => {
    if (view === 'chat-room' || view === 'livestream') return null; // Hide main header in chat room and livestream
    if (view === 'profile' && viewingProfile) return null; // Hide main header when viewing other profile (it has its own)

    return (
        <header className="fixed top-0 left-0 right-0 h-16 glass-nav z-50 flex items-center justify-between px-4">
            {/* NEW LOGO: Stacked DEAR X */}
            <div className="flex flex-col items-center justify-center leading-none select-none cursor-pointer" onClick={() => setView('swipe')}>
                <span className="text-[10px] font-black tracking-[0.25em] text-white">DEAR</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-blue to-brand-purple -mt-1">X</span>
            </div>

            <div className="flex items-center gap-3">
                {view === 'swipe' && (
                  <button 
                    onClick={() => setShowFilter(true)}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm active:scale-95 transition-transform hover:bg-white/20"
                  >
                    <Filter className="w-4 h-4 text-white" />
                  </button>
                )}

                <div className="bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5 backdrop-blur-sm">
                    <Gem className="w-4 h-4 text-brand-yellow" />
                    <span className="text-sm font-bold text-white">240</span>
                </div>
                <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center relative">
                    <Bell className="w-5 h-5 text-white" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-brand-yellow rounded-full"></span>
                </button>
            </div>
        </header>
    );
  };

  // Main Content
  const renderContent = () => {
      switch(view) {
          case 'swipe': return <SwipeView profiles={getFilteredProfiles()} onStartChat={handleStartChat} onTriggerSwipe={handleLike} onInfoClick={handleInfoClick} />;
          case 'discover': return <DiscoverView leaderboardData={leaderboard} onOpenStream={handleOpenStream} />;
          case 'livestream': return activeStream ? <LiveStreamView stream={activeStream} onClose={() => setView('discover')} /> : <DiscoverView leaderboardData={leaderboard} onOpenStream={handleOpenStream} />;
          case 'wallet': return <WalletView onTopUp={() => setShowTopUp(true)} />;
          case 'profile': 
            // If viewing another user's profile
            if (viewingProfile) {
              return (
                <ProfileView 
                  user={viewingProfile} 
                  isOwnProfile={false} 
                  onBack={handleBackFromProfile}
                  onStartChat={handleStartChat} 
                />
              );
            }
            // Own profile
            return (
              <ProfileView 
                user={MOCK_USER} 
                isOwnProfile={true}
                onOpenSettings={() => setActiveModal('settings')}
                onOpenVerification={() => setActiveModal('verification')}
                onOpenHelp={() => setActiveModal('help')}
                onSignOut={handleSignOut}
              />
            );
          case 'messages': return <ChatListView chats={chats} friends={MOCK_FRIENDS} onChatSelect={handleChatSelect} onStartChat={handleStartChat} />;
          case 'chat-room': return activeChat ? <ChatRoomView chat={activeChat} onBack={() => setView('messages')} onReportMessage={handleReportMessage} /> : <ChatListView chats={chats} friends={MOCK_FRIENDS} onChatSelect={handleChatSelect} onStartChat={handleStartChat} />;
          default: return <SwipeView profiles={getFilteredProfiles()} onStartChat={handleStartChat} onTriggerSwipe={handleLike} onInfoClick={handleInfoClick} />;
      }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#12122A] text-white overflow-hidden relative font-sans">
      {/* Mesh Background Global */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-brand-blue/30 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-brand-purple/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {renderHeader()}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative z-10 overflow-hidden ${view !== 'chat-room' && view !== 'livestream' && !(view === 'profile' && viewingProfile) ? 'pt-16 pb-24' : ''}`}>
          {renderContent()}
      </main>

      {/* Top Up Modal */}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
      
      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal onClose={() => setActiveModal(null)} onSignOut={handleSignOut} />
      )}
      
      {/* Verification Modal */}
      {activeModal === 'verification' && (
        <VerificationModal onClose={() => setActiveModal(null)} />
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <HelpModal onClose={() => setActiveModal(null)} />
      )}

      {/* Filter Modal */}
      {showFilter && (
        <FilterModal 
          currentFilters={filterSettings}
          onApply={(newFilters) => {
            setFilterSettings(newFilters);
            setShowFilter(false);
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal 
            onClose={() => setShowReportModal(false)} 
            userName={reportTargetName}
            targetContentId={reportTargetContentId}
        />
      )}

      {/* Bottom Navigation */}
      {view !== 'chat-room' && view !== 'livestream' && !(view === 'profile' && viewingProfile) && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 glass-nav border-t border-white/5 flex items-center justify-around px-2 z-50 pb-2">
            <button 
              onClick={() => setView('swipe')}
              className={`p-3 rounded-2xl transition-all ${view === 'swipe' ? 'text-brand-blue bg-brand-blue/10' : 'text-brand-subtext hover:text-white'}`}
            >
              <div className="relative">
                 <div className="w-6 h-6 flex items-center justify-center">
                    <LogoX className="w-5 h-5" />
                 </div>
                 {view === 'swipe' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-blue rounded-full"></div>}
              </div>
            </button>

            <button 
              onClick={() => setView('discover')}
              className={`p-3 rounded-2xl transition-all ${view === 'discover' ? 'text-brand-purple bg-brand-purple/10' : 'text-brand-subtext hover:text-white'}`}
            >
              <div className="relative">
                 <Compass className="w-6 h-6" />
                 {view === 'discover' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-purple rounded-full"></div>}
              </div>
            </button>

            <button 
              onClick={() => setView('messages')}
              className={`p-3 rounded-2xl transition-all ${view === 'messages' ? 'text-white bg-white/10' : 'text-brand-subtext hover:text-white'}`}
            >
              <div className="relative">
                 <MessageCircle className="w-6 h-6" />
                 {view === 'messages' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
                 {/* Badge */}
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center border border-[#12122A]">2</div>
              </div>
            </button>

            <button 
              onClick={() => setView('wallet')}
              className={`p-3 rounded-2xl transition-all ${view === 'wallet' ? 'text-brand-yellow bg-brand-yellow/10' : 'text-brand-subtext hover:text-white'}`}
            >
               <div className="relative">
                 <Wallet className="w-6 h-6" />
                 {view === 'wallet' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-yellow rounded-full"></div>}
              </div>
            </button>

            <button 
              onClick={() => setView('profile')}
              className={`p-3 rounded-2xl transition-all ${view === 'profile' && !viewingProfile ? 'text-white bg-white/10' : 'text-brand-subtext hover:text-white'}`}
            >
               <div className="relative">
                 <UserIcon className="w-6 h-6" />
                 {view === 'profile' && !viewingProfile && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
              </div>
            </button>
        </nav>
      )}

    </div>
  );
};

export default App;