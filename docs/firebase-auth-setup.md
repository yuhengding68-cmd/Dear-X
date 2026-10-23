# 登录上线前要你自己完成的控制台步骤

代码已经调用 Firebase Auth。下面这些开关、密钥和域名只能在 Firebase 和 Apple 的网站上打开，仓库里不能代填。不要把私钥、APNs `.p8`、服务账号 JSON、App Check 调试令牌或 `GEMINI_API_KEY` 提交进 git。

Firebase Web 配置（`apiKey`、`authDomain`、`projectId`、`appId`）是公开的客户端配置，放在本机 `.env.local`，不要当成服务器密钥。

演示模式（`VITE_DATA_MODE=demo`）不会发短信，也不会联系 Apple 或 Google。下面的步骤只对 `VITE_DATA_MODE=firebase` 生效。

## 1. 打开登录提供方

1. 打开 [Firebase console](https://console.firebase.google.com/) ，进入这个项目。
2. **Build → Authentication → Sign-in method**。
3. 启用 **Phone**。
4. 启用 **Google**。支持邮箱留空即可，除非你要限制某个 Workspace 域。
5. 启用 **Apple**。先保存，Apple 的 Service ID 和密钥在下一节填回来。
6. **Authentication → Settings → Authorized domains** 加上：
   - `localhost`
   - 你的托管域名（例如 `your-app.web.app` 和正式域名）
7. 项目需要 Blaze 套餐，否则手机短信发不出去。

## 2. 网页客户端配置

1. **Project settings → General → Your apps**。没有 Web 应用就点 **Add app → Web**。
2. 把配置抄进 `.env.local`（文件已被 git 忽略）：

```bash
VITE_DATA_MODE=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_STORAGE_BUCKET=
```

3. 部署函数和现有规则（本步没有改规则文件）：

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions,firestore:rules
```

函数区域是 `australia-southeast1`。手机号登录在发短信之前会调用 `reservePhoneSignIn`。同一个号码 30 秒内只能请求一次，每小时最多 5 次。同一个 IP 10 秒内一次，每小时最多 20 次。额度记在哈希后的文档里，不保存明文手机号。

年龄判断在 `completeOnboarding` 和 `rejectUnderage` 里按澳大利亚悉尼的日历日期执行。出生日期只写在私有的 `users/{uid}`。公开的 `profiles/{uid}` 只保存周岁数字。未满 18 岁会写入 `ageDenials` 并删除 Auth 用户。删号仍走已有的 `deleteAccount`。

## 3. 网页 reCAPTCHA 和 App Check

手机号登录在网页上使用隐形 reCAPTCHA（页面里的 `dearx-recaptcha`）。另外再注册 App Check，用来保护 `reservePhoneSignIn`。

1. 打开 [Google reCAPTCHA 管理后台](https://www.google.com/recaptcha/admin) 或 Firebase 的 App Check 向导。新项目用 **reCAPTCHA Enterprise**。
2. 域名加上 `localhost` 和正式域名。
3. Firebase：**Build → App Check → Apps → 你的 Web 应用 → reCAPTCHA Enterprise**（或 reCAPTCHA v3）。
4. 把站点密钥放进 `.env.local`：

```bash
VITE_FIREBASE_APPCHECK_SITE_KEY=
VITE_FIREBASE_APPCHECK_PROVIDER=enterprise
```

站点密钥是公开的。如果控制台给的是 v3 而不是 Enterprise，把第二行改成 `v3`。

5. 本地调试可以在 App Check 里生成调试令牌，只放在本机 `.env.local`：

```bash
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=
```

不要提交这个令牌。

6. 确认登录可用之后，再到 App Check 里对 **Cloud Functions** 选择 **Enforce**。然后在 `functions/.env`（已被 git 忽略）写上 `ENFORCE_APP_CHECK=true`，重新部署函数。没配好密钥之前不要打开强制，否则登录会被拒绝。

Firebase Authentication 产品本身也可以在 App Check 里 Enforce。那会挡住没有证明的短信请求。网页配好 reCAPTCHA、iOS 配好 DeviceCheck 或 App Attest 之后再开。

## 4. Sign in with Apple

Firebase 网页端使用弹窗。弹窗被拦截时会改走重定向。iOS 壳使用 Capacitor 插件，见第 6 节。

在 [Apple Developer](https://developer.apple.com/account/resources) 准备这些东西。

### App ID

1. **Certificates, Identifiers & Profiles → Identifiers → App IDs**。
2. 选中 iOS App ID（没有就新建，Bundle ID 例如 `app.dearx.ios`）。
3. 勾选 **Sign in with Apple**，保存。

### Service ID（网页和 Firebase 用这个）

1. **Identifiers → Service IDs → +**。
2. 描述写 `DearX Web`。Identifier 例如 `app.dearx.signin`。这个字符串就是 Firebase 里的 **Services ID**。
3. 勾选 **Sign in with Apple → Configure**。
4. **Primary App ID** 选上一步的 App ID。
5. **Domains** 填 Firebase 的授权域名，不带 `https://`，例如 `your-project.firebaseapp.com` 和你的正式域名。
6. **Return URLs** 填：

```text
https://your-project.firebaseapp.com/__/auth/handler
```

把 `your-project` 换成 **Project settings** 里的 Project ID。如果用了自定义 auth 域名，再加一条对应的 `/__/auth/handler`。

### 密钥

1. **Keys → +**。
2. 名称写 `DearX Sign in with Apple`。
3. 勾选 **Sign in with Apple**，Configure 选中同一个 Primary App ID。
4. 注册后下载 `.p8`。每个密钥只能下载一次。不要提交这个文件。
5. 记下 **Key ID**，以及页面右上角的 **Team ID**。

### 填回 Firebase

**Authentication → Sign-in method → Apple**：

| Firebase 字段 | 填什么 |
| --- | --- |
| Services ID | Service ID，例如 `app.dearx.signin` |
| Apple Team ID | Membership 页面上的 Team ID |
| Key ID | 刚才那把密钥的 Key ID |
| Private key | `.p8` 文件里的全文，包含 `BEGIN PRIVATE KEY` 两行 |

保存。OAuth 授权码流的密钥字段留空，除非 Apple 控制台单独要求。

## 5. iOS 短信静默推送（APNs）

真机上的手机号登录依赖 APNs，否则会报 `auth/missing-client-identifier`。模拟器经常收不到生产推送。

1. **Keys → +**，名称 `DearX APNs`。可以和 Sign in with Apple 共用一把勾了 **Apple Push Notifications service (APNs)** 的密钥，也可以单独一把。
2. 下载 `.p8`，记下 Key ID 和 Team ID。不要提交文件。
3. Firebase：**Project settings → Cloud Messaging → Apple app configuration → Upload APNs Authentication Key**。
4. 填 Key ID、Team ID，上传 `.p8`。
5. iOS 应用的 Bundle ID 必须和 Firebase iOS 应用、Apple App ID 一致。
6. Xcode 里打开 **Push Notifications** 和 **Background Modes → Remote notifications**。

## 6. Capacitor iOS

网页继续用 JS SDK：隐形 reCAPTCHA、`signInWithPopup`，弹窗被拦时用 `signInWithRedirect`。

在 Capacitor iOS 里（`Capacitor.getPlatform() === 'ios'`）改走原生插件。插件没装时，登录按钮会提示安装，不会偷偷用网页弹窗。

在你自己的机器上执行（不要把 `.p8` 或 Google 的反代文件提交进来）：

```bash
npm install @capacitor/core @capacitor/ios @capacitor-firebase/authentication @capacitor-firebase/app-check
npx cap add ios
npx cap sync ios
```

然后：

1. `GoogleService-Info.plist` 放进 Xcode 工程，不要提交到公开仓库。
2. Authentication 插件按它的 README 打开 `skipNativeAuth: false`，让原生登录完成后再把 ID token 交回网页 SDK。本仓库的网页代码会调用 `signInWithCredential`。
3. App Check 插件在 iOS 上使用 **DeviceCheck** 或 **App Attest**。在 Firebase App Check 里注册这个 iOS 应用后再 Enforce。
4. Apple 登录还要在 Xcode 的 **Signing & Capabilities** 加上 **Sign in with Apple**。
5. Google 登录还要在 Firebase 下载 `GoogleService-Info.plist` 里的 `REVERSED_CLIENT_ID`，加到 URL Types。

## 7. 你怎么确认已经通了

1. `.env.local` 设为 `firebase`，重启 `npm run dev`。
2. 用你自己的手机号走完短信。错误会显示在原来的登录文案位置：号码无效、验证码错误、验证码过期、请求太频繁、reCAPTCHA / App Check 失败、提供方没启用。
3. 点 **Continue with Apple** 和 **Continue with Google**。两者都留在界面上。Google 还在，Apple 就是真实的 Firebase Apple 登录，不是占位会话。
4. 用一个未满 18 岁的出生日期完成注册。函数会拒绝，Auth 用户会被删掉，这个号码和 uid 的哈希会留在 `ageDenials`。出生日期不会出现在 `profiles` 文档里。
5. 在资料里删除账号。`deleteAccount` 会删掉私有用户、公开资料和 Auth 用户。你提交过的举报会改成 `deleted-user`，方便安全记录留下来。

演示模式里，种子号码仍然一键进入。其他号码的验证码固定是 `000000`，并且遵守同样的 30 秒 / 每小时 5 次限制。那不是真实短信。
