import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText, Lock } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] z-[101] px-4"
          >
            <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0a0a0f] sticky top-0 z-10">
                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                  {title === 'Terms of Service' ? <FileText className="w-5 h-5 text-brand-light-purple" /> : <Lock className="w-5 h-5 text-brand-light-purple" />}
                  {title}
                </h3>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar text-white/70 text-sm leading-relaxed space-y-4">
                {children}
              </div>
              <div className="p-6 border-t border-white/10 bg-[#0a0a0f] flex justify-end">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const TermsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service (EULA)">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">1. Acceptance of Terms</h4>
        <p>By downloading, installing, or using the DearX application ("App"), you agree to be bound by this End User License Agreement ("EULA"). If you do not agree to these terms, do not use the App. This agreement is between you and DearX, not with Apple or Google.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">2. Eligibility</h4>
        <p>You must be at least 18 years of age to use DearX. By using the App, you warrant that you have the right, authority, and capacity to enter into this Agreement and to abide by all of the terms and conditions of this Agreement.</p>
      </section>

      <section className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
        <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          3. Zero Tolerance Policy & User Conduct
        </h4>
        <p className="mb-2">DearX is committed to maintaining a safe, respectful, and positive community. We have a <strong>ZERO TOLERANCE</strong> policy for objectionable content and abusive behavior.</p>
        <p className="mb-2">You agree NOT to post, upload, or transmit any content that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</li>
          <li>Contains hate speech, racism, or discrimination against any group or individual.</li>
          <li>Depicts sexual acts, nudity, or pornography.</li>
          <li>Promotes illegal activities or physical harm.</li>
          <li>Involves spamming, solicitation, or fraudulent schemes.</li>
        </ul>
        <p className="mt-2"><strong>Enforcement:</strong> Any user found violating this policy will have their content removed and their account <strong>permanently banned</strong> immediately and without warning. We provide in-app reporting and blocking mechanisms to allow users to flag objectionable content.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">4. Virtual Goods and Payments</h4>
        <p>The App allows you to purchase virtual items ("Gifts") and currency ("Diamonds").</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>No Ownership:</strong> You do not own Virtual Goods; you purchase a limited, revocable license to use them.</li>
          <li><strong>Non-Refundable:</strong> All purchases are final and non-refundable, except as required by law.</li>
          <li><strong>Cash Out:</strong> Users may be eligible to exchange earned Diamonds for real currency subject to our withdrawal thresholds, verification processes, and transaction fees. We reserve the right to modify exchange rates at any time.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">5. User Generated Content</h4>
        <p>You retain ownership of the content you post, but you grant DearX a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content in connection with the App. You represent that you own or have the necessary rights to your content.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">6. Termination</h4>
        <p>DearX reserves the right to suspend or terminate your account at any time, for any reason, including if we believe you have violated this EULA. Upon termination, your right to use the App and any Virtual Goods will immediately cease.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">7. Disclaimer of Warranties</h4>
        <p>The App is provided "AS IS" without warranties of any kind. We do not guarantee that the App will be error-free, secure, or available at all times.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">8. Contact Information</h4>
        <p>For questions regarding this EULA or to report violations, please contact us at: legal@dearx.app</p>
      </section>
    </div>
  </Modal>
);

export const PrivacyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">1. Introduction</h4>
        <p>Your privacy is important to DearX ("we", "us", "our"). This Privacy Policy explains how we collect, use, and protect your personal information when you use our mobile application and services.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">2. Information We Collect</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, gender, and profile photos.</li>
          <li><strong>Usage Data:</strong> Interactions with other users, gifts sent/received, and time spent on the App.</li>
          <li><strong>Device Information:</strong> IP address, device type, operating system, and unique device identifiers.</li>
          <li><strong>Location Data:</strong> Approximate location (if you grant permission) to help you find users nearby.</li>
          <li><strong>Payment Information:</strong> Transaction history. Financial data for withdrawals is processed by secure third-party payment providers.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">3. How We Use Your Information</h4>
        <p>We use your data to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Provide and improve the App's functionality.</li>
          <li>Facilitate matching and social interactions.</li>
          <li>Process transactions and withdrawals.</li>
          <li>Ensure safety and enforce our Zero Tolerance Policy against abuse.</li>
          <li>Send administrative and marketing communications (which you can opt-out of).</li>
        </ul>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">4. Data Sharing and Disclosure</h4>
        <p>We do not sell your personal data. We may share information with:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Service Providers:</strong> For hosting, analytics, customer support, and payments.</li>
          <li><strong>Legal Requirements:</strong> If required by law or to protect the safety of our users.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">5. Data Retention and Deletion</h4>
        <p>We retain your data as long as your account is active. You have the right to request the deletion of your account and personal data at any time via the App settings or by contacting privacy@dearx.app. Upon request, we will delete your data within 30 days, except where retention is required by law.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">6. Security</h4>
        <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">7. Children's Privacy</h4>
        <p>DearX is restricted to users aged 18 and older. We do not knowingly collect data from children under 18. If we become aware that a child has provided us with personal data, we will delete it immediately.</p>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">8. Changes to This Policy</h4>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
      </section>
    </div>
  </Modal>
);

export const AboutUsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="About Us">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">Our Mission</h4>
        <p>At DearX, we believe that your time and attention are valuable. We're building an economy of attention where meaningful connections are rewarded, and the noise of traditional dating apps is filtered out.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2">The DearX Difference</h4>
        <p>We've replaced endless swiping with a system that values intent. By introducing virtual gifts as a way to initiate conversations, we ensure that every interaction starts with genuine interest and respect.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2">Our Team</h4>
        <p>We are a passionate team of designers, engineers, and community builders dedicated to creating the most premium and rewarding social experience on the market.</p>
      </section>
    </div>
  </Modal>
);

export const CareersModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Careers">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">Join the Revolution</h4>
        <p>We're always looking for talented individuals who are passionate about redefining social connections and the creator economy.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2">Open Positions</h4>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Senior iOS Engineer</strong> - Remote (US/Canada)</li>
          <li><strong>Product Designer</strong> - New York / Remote</li>
          <li><strong>Community Trust & Safety Lead</strong> - London / Remote</li>
          <li><strong>Backend Engineer (Go/Node.js)</strong> - Remote</li>
        </ul>
      </section>
      <section>
        <p className="mt-4">Don't see a perfect fit? Send your resume to <a href="mailto:careers@dearx.app" className="text-brand-light-purple hover:underline">careers@dearx.app</a> and tell us how you can contribute.</p>
      </section>
    </div>
  </Modal>
);

export const PressModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Press & Media">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">Media Inquiries</h4>
        <p>For all press and media inquiries, including interview requests, brand assets, and press releases, please contact our communications team.</p>
        <p className="mt-2"><a href="mailto:press@dearx.app" className="text-brand-light-purple hover:underline">press@dearx.app</a></p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2">Brand Assets</h4>
        <p>Download our official logos, app screenshots, and brand guidelines from our media kit.</p>
        <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">
          Download Media Kit (ZIP)
        </button>
      </section>
    </div>
  </Modal>
);

export const ContactModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Contact Us">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">Get in Touch</h4>
        <p>We're here to help. Choose the best way to reach our team below.</p>
      </section>
      <div className="grid gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h5 className="font-bold text-white mb-1">Customer Support</h5>
          <p className="text-sm mb-2">For issues with your account, payments, or the app.</p>
          <a href="mailto:support@dearx.app" className="text-brand-light-purple hover:underline text-sm">support@dearx.app</a>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h5 className="font-bold text-white mb-1">Partnerships</h5>
          <p className="text-sm mb-2">For business development and creator partnerships.</p>
          <a href="mailto:partners@dearx.app" className="text-brand-light-purple hover:underline text-sm">partners@dearx.app</a>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h5 className="font-bold text-white mb-1">Trust & Safety</h5>
          <p className="text-sm mb-2">To report serious violations or safety concerns.</p>
          <a href="mailto:safety@dearx.app" className="text-brand-light-purple hover:underline text-sm">safety@dearx.app</a>
        </div>
      </div>
    </div>
  </Modal>
);

export const CookiePolicyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Cookie Policy">
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2">1. What Are Cookies</h4>
        <p>Cookies are small text files that are placed on your device when you visit our website or use our app. They help us provide you with a better, faster, and safer experience.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2">2. How We Use Cookies</h4>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Essential Cookies:</strong> Required for the basic operation of our platform, such as keeping you logged in securely.</li>
          <li><strong>Performance & Analytics:</strong> Help us understand how users interact with DearX so we can improve the experience.</li>
          <li><strong>Functionality:</strong> Remember your preferences and settings.</li>
        </ul>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2">3. Managing Cookies</h4>
        <p>You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.</p>
      </section>
    </div>
  </Modal>
);

export const SafetyTipsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Safety Tips">
    <div className="space-y-6">
      <section className="bg-brand-light-purple/10 border border-brand-light-purple/20 p-4 rounded-xl">
        <h4 className="text-brand-light-purple font-bold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Your Safety is Our Priority
        </h4>
        <p>While DearX is designed to foster genuine connections, it's important to stay smart and safe when interacting with new people online and offline.</p>
      </section>
      
      <section>
        <h4 className="text-white font-bold mb-2">Online Safety</h4>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Never Send Money:</strong> Never send money, crypto, or financial information to anyone you meet on the app, even if they claim to be in an emergency.</li>
          <li><strong>Protect Personal Info:</strong> Don't share your home address, workplace, or daily routine until you truly know someone.</li>
          <li><strong>Keep Conversations on DearX:</strong> Scammers often try to move conversations to text, WhatsApp, or other platforms quickly. Stay on the app while you're getting to know someone.</li>
          <li><strong>Report Suspicious Behavior:</strong> Use our in-app reporting tools if someone is harassing you, asking for money, or behaving inappropriately.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-white font-bold mb-2">Meeting Offline</h4>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Meet in Public:</strong> For your first few dates, always meet in a populated, public place like a cafe or restaurant.</li>
          <li><strong>Tell a Friend:</strong> Let someone know where you're going, who you're meeting, and when you expect to be back.</li>
          <li><strong>Control Your Transportation:</strong> Drive yourself or use a ride-share app. Don't rely on your date for transportation early on.</li>
          <li><strong>Trust Your Instincts:</strong> If something feels off, leave. Your safety is more important than being polite.</li>
        </ul>
      </section>
    </div>
  </Modal>
);
