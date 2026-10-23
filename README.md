# DearX

Safety-first dating for Chinese-speaking Australians and students, plus a separate non-adult creator section. Dating chat is free after a mutual match.

The privacy policy and terms in the app are drafts. They need an Australian lawyer before publication.

## Run the demo

The app does not fall back to mock data on its own. Demo mode has to be requested.

1. `npm install`
2. Copy `.env.example` to `.env.local` and leave `VITE_DATA_MODE=demo`
3. `npm run dev`

Demo sign-in does not send SMS. These numbers open seeded accounts immediately:

- Member `+61 400 000 002` — has a mutual match and has blocked one creator
- Admin `+61 400 000 001` — review queue for reports and pending posts
- Creator `+61 400 000 003` — identity check already verified, balance is demo-only

Any other number shows the code screen. The demo code is `000000`. It does not send an SMS. Asking again within 30 seconds shows the rate-limit error. Apple and Google stay on the login screen. In demo mode they create a placeholder session and do not call those providers. In firebase mode they call Firebase Auth.

## Checks

- `npm run test:unit` — age gate, config mode, mutual matching, keyword moderation
- `npm run lint` — app TypeScript and Cloud Functions compile
- `npm run build` — production web build

## Firebase

Set `VITE_DATA_MODE=firebase` and the `VITE_FIREBASE_*` web config. Deploy `firestore.rules` and the functions in `functions/` to `australia-southeast1`.

Phone SMS, Sign in with Apple, and Google are real Firebase Auth calls in firebase mode. The buttons stay on the original login screen. Console setup, the Apple Service ID, the APNs key, reCAPTCHA, and App Check are in [docs/firebase-auth-setup.md](docs/firebase-auth-setup.md). You have to do those steps in the Firebase and Apple consoles.

```bash
cd functions && npm install && npm run build
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only firestore:rules,functions
```

Give an admin their role in the console after onboarding: set `users/{uid}.role` to `admin`. Clients cannot write that field.

`GEMINI_API_KEY` is read only inside Cloud Functions. It is not injected into the Vite bundle.

## What is still a stub

- Phone SMS, Sign in with Apple, and Google call Firebase Auth once the providers in [docs/firebase-auth-setup.md](docs/firebase-auth-setup.md) are enabled. Until then those buttons return a setup error. Demo mode still does not contact Apple, Google, or the SMS gateway.
- Identity checks name Didit or Veriff but do not call them. `completeStubKyc` simulates a result unless `KYC_MODE=live`.
- Purchases are shaped like Apple / Google in-app purchases. `StubIapVerifier` does not charge a store.
- Payouts call an Airwallex-shaped provider that does not transfer money. Only Cloud Functions can write balances, purchases, and payouts.
- Gemini moderation runs only after the functions secret is set. Until then, `sendMessage` and `submitCreatorPost` fail closed.

The functions have not been deployed from this repository, and there is no automated test against the Firebase emulators.
