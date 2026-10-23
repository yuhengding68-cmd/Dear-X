# 编辑资料和照片审核要你自己打开的开关

编辑资料、多图上传和分享按钮已经接到现有资料页。演示模式（`VITE_DATA_MODE=demo`）不访问 Firebase，文字用关键词拦截，照片只根据文件名做同样的拦截，方便本地看界面。真人裸露检查只在 Cloud Functions 里用 Gemini 看图片字节。

`GEMINI_API_KEY` 仍然只放在 Functions secret 里，不要写进 Vite，也不要提交。

## 1. 打开 Storage

1. Firebase 控制台 → **Build → Storage** → 开始使用，区域选离澳洲近的桶（函数在 `australia-southeast1`）。
2. 把默认桶名抄进 `.env.local` 的 `VITE_FIREBASE_STORAGE_BUCKET`。没有这个值时，正式模式的上传会停在客户端，不会把图片写成公开资料。
3. 部署存储规则和函数（**不要**用这次改动去覆盖 Firestore 规则以外的控制台手工改动；仓库里的 `firestore.rules` 这次没有改）：

```bash
cd functions && npm install && npm run build && cd ..
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only storage,functions
```

`storage.rules` 只允许登录用户读写自己的 `users/{uid}/photos/{photoId}`，且必须是 8 MB 以内的 JPEG、PNG 或 WebP。其他路径默认拒绝。别人不能从 Storage 直接读你的原图。

审核通过后，函数才会给这张图写下载 token，并把这个 URL 放进公开的 `profiles/{uid}`。未通过或还在审核的图没有公开 URL。

## 2. 审核失败时会怎样

- 文字（名字、简介、兴趣、职业）先过关键词，再过 Gemini。任一环节拒绝：公开资料保持上一版已通过的文字。
- 照片先记为 `pending`，Gemini 看图。明确拒绝（含裸露）变成 `rejected`，不进入 `photoUrl` / `photoUrls`。
- 没有密钥，或 Gemini 的结果读不出来：文字修改不会发布；照片停在 `pending`，同样不会公开。
- 再次修改会重新审核。通过之后才替换公开字段。删号时会尝试删掉 `users/{uid}/photos/`。

城市只能是悉尼、墨尔本、布里斯班、珀斯、阿德莱德、堪培拉、霍巴特、黄金海岸，不存坐标。

## 3. 注册时的简介和照片

`completeOnboarding` 使用同一套审核。关键词或 Gemini 拒绝、Gemini 读不出来、或远程照片拉不下来时，公开资料用名字 Member、空简介、无照片。用户仍完成注册，私有文档留着待审草稿，编辑资料里可以再改。通过之后才会写进公开资料。

## 4. 分享

分享只带显示名、城市和链接 `{origin}/p/{uid}`。链接里没有手机号、出生日期或邮箱。打开链接的人登录后只能看到已经公开的资料。
