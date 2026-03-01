import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, DollarSign, Shield, Smartphone, ArrowRight, Star, Check, Wallet, TrendingUp } from 'lucide-react';
import { TermsModal, PrivacyModal, AboutUsModal, CareersModal, PressModal, ContactModal, CookiePolicyModal, SafetyTipsModal } from './components/LegalModals';
import { DownloadModal } from './components/DownloadModal';

const Logo = () => (
  <div className="flex flex-col items-center justify-center font-display font-bold tracking-[0.2em] leading-none">
    <span className="text-2xl text-white">DEAR</span>
    <span className="text-4xl text-gradient -mt-1">X</span>
  </div>
);

const heroMedia = [
  {
    video: "https://assets.mixkit.co/videos/preview/mixkit-couple-checking-something-in-a-smartphone-in-a-bar-36452-large.mp4", // Couple looking at phone in a bar
    poster: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=2000&q=80"
  },
  {
    video: "https://assets.mixkit.co/videos/preview/mixkit-couple-looking-at-selfies-in-their-cell-phone-21292-large.mp4", // Couple looking at selfies
    poster: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=2000&q=80"
  },
  {
    video: "https://assets.mixkit.co/videos/preview/mixkit-romantic-couple-looking-at-something-on-a-phone-in-the-45791-large.mp4", // Couple looking at phone in park
    poster: "https://images.unsplash.com/photo-1538220855871-c6517bcfaaca?auto=format&fit=crop&w=2000&q=80"
  }
];

export default function App() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isCareersOpen, setIsCareersOpen] = useState(false);
  const [isPressOpen, setIsPressOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCookiePolicyOpen, setIsCookiePolicyOpen] = useState(false);
  const [isSafetyTipsOpen, setIsSafetyTipsOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMedia((prev) => (prev + 1) % heroMedia.length);
    }, 4000); // Faster interval for videos
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-light-purple selection:text-white overflow-x-hidden">
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <AboutUsModal isOpen={isAboutUsOpen} onClose={() => setIsAboutUsOpen(false)} />
      <CareersModal isOpen={isCareersOpen} onClose={() => setIsCareersOpen(false)} />
      <PressModal isOpen={isPressOpen} onClose={() => setIsPressOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <CookiePolicyModal isOpen={isCookiePolicyOpen} onClose={() => setIsCookiePolicyOpen(false)} />
      <SafetyTipsModal isOpen={isSafetyTipsOpen} onClose={() => setIsSafetyTipsOpen(false)} />
      <DownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-[90vh] flex items-center">
        {/* Full-screen Background Video Slideshow */}
        <div className="absolute inset-0 z-0 bg-[#050505]">
          {heroMedia.map((media, index) => (
            <motion.div
              key={media.video}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: index === currentMedia ? 0.6 : 0,
                scale: index === currentMedia ? 1 : 1.05
              }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <video
                src={media.video}
                poster={media.poster}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
          
          {/* Gradient overlays to blend with the dark theme and ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60" />
          <div className="absolute inset-0 bg-brand-purple/20 mix-blend-color pointer-events-none" />
          
          {/* Floating Particles */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100 - Math.random() * 100],
                  x: [0, (Math.random() - 0.5) * 50],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0.5],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 text-sm font-medium text-brand-light-purple"
            >
              <Star className="w-4 h-4" />
              <span>A new way to connect</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-[1.1]">
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-block">Connect.</motion.span> <br />
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="text-gradient inline-block">Gift.</motion.span>{' '}
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="inline-block">Vibe.</motion.span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Skip the endless swiping. Stand out by sending a gift to unlock conversations with people you truly want to meet. <strong className="text-white font-semibold">Turn your charm into real, withdrawable income.</strong>
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.button 
                onClick={() => setIsDownloadOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#4a60ff] to-[#a044ff] text-white font-semibold text-lg hover:shadow-[0_0_30px_rgba(160,68,255,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Download DearX
              </motion.button>
              <motion.button 
                onClick={() => setIsAboutUsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Learn More
              </motion.button>
            </motion.div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-white/50">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i, idx) => (
                  <motion.img 
                    key={i} 
                    src={`https://picsum.photos/seed/${i}/100/100`} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border-2 border-[#1d35a7] object-cover relative" 
                    referrerPolicy="no-referrer"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + idx * 0.1, type: "spring", stiffness: 200 }}
                    whileHover={{ y: -5, scale: 1.1, zIndex: 10 }}
                  />
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                Join 100,000+ users vibing today
              </motion.p>
            </div>
          </motion.div>

          {/* App Mockup Representation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[320px] lg:max-w-[400px]"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#4a60ff] to-[#a044ff] rounded-[3rem] blur-3xl opacity-30 animate-pulse" />
              
              <div className="relative bg-[#050505] border border-white/10 rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-hero-gradient rounded-[2.5rem] overflow-hidden relative aspect-[9/19] flex flex-col items-center justify-center p-8 text-center">
                  <div className="absolute top-0 inset-x-0 h-6 bg-black/20 backdrop-blur-md" /> {/* Notch */}
                  
                  <div className="mb-12 scale-150">
                    <Logo />
                  </div>
                  
                  <p className="text-white/80 font-medium mb-8">Connect. Gift. Vibe.</p>
                  
                  <div className="w-full space-y-4">
                    <div className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4a60ff] to-[#a044ff] flex items-center justify-center gap-2 font-medium">
                      <Smartphone className="w-4 h-4" /> Continue with Phone
                    </div>
                    <div className="w-full py-3.5 rounded-xl bg-white text-black flex items-center justify-center gap-2 font-medium">
                      Continue with Apple
                    </div>
                    <div className="w-full py-3.5 rounded-xl bg-[#2c303a] flex items-center justify-center gap-2 font-medium">
                      Continue with Google
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-white/40 mt-8 max-w-[200px]">
                    By continuing, you agree to our <button onClick={() => setIsTermsOpen(true)} className="underline hover:text-white">Terms of Service</button> and <button onClick={() => setIsPrivacyOpen(true)} className="underline hover:text-white">Privacy Policy</button>.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Redefining Social Value</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              DearX isn't just another dating app. It's an economy of attention where your time is respected and rewarded.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart className="w-8 h-8 text-[#a044ff]" />,
                title: "Stand Out Instantly",
                desc: "Send a virtual gift to bypass the queue. Show you're serious and instantly grab their attention."
              },
              {
                icon: <DollarSign className="w-8 h-8 text-[#4a60ff]" />,
                title: "Earn Real Money",
                desc: "Every gift you receive has real cash value. Accumulate diamonds from chats and withdraw them directly to your bank account."
              },
              {
                icon: <Shield className="w-8 h-8 text-[#1d35a7]" />,
                title: "Quality Over Quantity",
                desc: "The gifting mechanism naturally filters out spam and low-effort messages, ensuring high-quality connections."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10, scale: 1.02 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="glass-panel p-8 rounded-3xl hover:bg-white/[0.08] transition-all cursor-pointer group relative overflow-hidden border border-white/5 hover:border-white/20 hover:shadow-[0_0_40px_rgba(160,68,255,0.15)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#a044ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 relative z-10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed relative z-10">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Earning Showcase Feature */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mt-24 glass-panel rounded-[2.5rem] p-8 md:p-12 border border-brand-light-purple/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand-purple/10 to-transparent pointer-events-none" />
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light-purple/10 text-brand-light-purple text-sm font-bold mb-6 border border-brand-light-purple/20">
                  <Wallet className="w-4 h-4" />
                  <span>Monetization</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-display font-bold mb-6">Turn Your Charm into <span className="text-gradient">Real Income</span></h3>
                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  Don't just chat for free. On DearX, your time and attention are valuable assets. Receive virtual gifts from admirers and cash them out directly to your bank account.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    { text: 'Instant Withdrawals to Bank/PayPal', icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
                    { text: 'Keep up to 80% of Gift Value', icon: <DollarSign className="w-4 h-4 text-brand-light-purple" /> },
                    { text: '100% Secure Transactions', icon: <Shield className="w-4 h-4 text-blue-400" /> }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90 font-medium">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        {item.icon}
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>
                <button className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Start Earning Today
                </button>
              </div>
              
              {/* Visual Mockup */}
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute inset-0 bg-brand-purple/30 blur-[80px] rounded-full" />
                <div className="glass-panel rounded-3xl p-6 relative border border-white/10 shadow-2xl bg-[#0a0a0f]/80 backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <p className="text-white/50 text-sm font-medium mb-1">Total Balance</p>
                      <h4 className="text-4xl font-display font-bold text-white">$1,254.00</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-brand-light-purple/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-brand-light-purple" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 flex items-center justify-center text-xl shadow-lg">💎</div>
                        <div>
                          <p className="font-bold text-sm">Diamond Gift</p>
                          <p className="text-xs text-white/40">From @alex_k</p>
                        </div>
                      </div>
                      <span className="text-green-400 font-mono font-bold">+$50.00</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-xl shadow-lg">🌹</div>
                        <div>
                          <p className="font-bold text-sm">Rose Bouquet</p>
                          <p className="text-xs text-white/40">From @jordan_m</p>
                        </div>
                      </div>
                      <span className="text-green-400 font-mono font-bold">+$15.00</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-lg">👑</div>
                        <div>
                          <p className="font-bold text-sm">Crown</p>
                          <p className="text-xs text-white/40">From @sarah_99</p>
                        </div>
                      </div>
                      <span className="text-green-400 font-mono font-bold">+$100.00</span>
                    </div>
                  </div>
                  
                  <button className="w-full py-3 rounded-xl bg-brand-light-purple text-white font-bold hover:bg-brand-light-purple/90 transition-colors shadow-lg shadow-brand-light-purple/20">
                    Cash Out Now
                  </button>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 glass-panel px-4 py-2 rounded-full border border-green-500/30 text-green-400 text-sm font-bold flex items-center gap-2 shadow-xl"
                >
                  <TrendingUp className="w-4 h-4" />
                  +24% this week
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-blue/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-purple/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Loved by Thousands</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              See what our community has to say about their experience on DearX.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Jenkins",
                role: "Model & Influencer",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                quote: "I was tired of endless swiping. DearX filters out the noise. The gifting feature shows me who's actually serious about connecting.",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Entrepreneur",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                quote: "The quality of conversations here is unmatched. It feels premium, exclusive, and worth every penny. Highly recommended.",
                rating: 5
              },
              {
                name: "Jessica Alva",
                role: "Digital Artist",
                image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                quote: "Finally, an app that values my time. I've met amazing people and the extra income from gifts is a fantastic bonus!",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-1 mb-6 text-yellow-400">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-white/80 mb-8 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <h4 className="font-bold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-white/40">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="glass-panel rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden group border border-white/10 hover:border-white/20 transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-hero-gradient opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="relative z-10">
              <motion.h2 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-4xl md:text-6xl font-display font-bold mb-6"
              >
                Ready to Earn?
              </motion.h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of users who are making meaningful connections and earning real money every day on DearX.
              </p>
              <motion.button 
                onClick={() => setIsDownloadOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-shadow"
              >
                Download the App Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="mb-6">
                <Logo />
              </div>
              <p className="text-white/50 max-w-sm">
                The premium dating experience where your time is valued. Connect, gift, and vibe with verified users.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><button onClick={() => setIsAboutUsOpen(true)} className="hover:text-white transition-colors text-left">About Us</button></li>
                <li><button onClick={() => setIsCareersOpen(true)} className="hover:text-white transition-colors text-left">Careers</button></li>
                <li><button onClick={() => setIsPressOpen(true)} className="hover:text-white transition-colors text-left">Press</button></li>
                <li><button onClick={() => setIsContactOpen(true)} className="hover:text-white transition-colors text-left">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
                <li><button onClick={() => setIsPrivacyOpen(true)} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setIsCookiePolicyOpen(true)} className="hover:text-white transition-colors text-left">Cookie Policy</button></li>
                <li><button onClick={() => setIsSafetyTipsOpen(true)} className="hover:text-white transition-colors text-left">Safety Tips</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-white/40 text-sm">
            <p>© 2026 DearX. All rights reserved.</p>
            <p>DearX has a zero-tolerance policy for objectionable content.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
