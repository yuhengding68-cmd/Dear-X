# 筛选、通知和在线状态

这一步把发现筛选、应用内通知、匹配/新消息推送，以及聊天里的在线状态接到服务器。界面仍是原来的筛选页、铃铛和设置开关。`firestore.rules` 没有改。客户端不能写 `profiles` 或 `users`，所以筛选、收件箱、已读、在线心跳和 FCM 令牌都由 Cloud Functions（Admin SDK）写入。

## 已经接上的行为

- 发现筛选保存在私人文档 `users/{uid}.discoverFilters`（年龄、最远距离、展示性别）。发现列表走 `listDiscovery`。年龄下限是 18，距离是城市到城市的粗略公里数，同一城市为 0，没有 GPS。未知城市或表里没有的城市对会被排除。滑条上限是 100 公里，和原来的筛选页一致。
- 铃铛打开应用内通知中心。条目只有类型：匹配、新消息、举报状态、审核结果，以及可选的 `chatId` 和短状态码。没有消息正文、姓名、电话、邮箱或简介。关闭通知中心时未读项标为已读。
- 匹配和新消息会在收件人打开推送、并且存有 FCM 令牌时发送推送。推送标题是 `DearX`，正文是固定英文句子，不含对方资料或消息内容。举报和审核只进应用内通知，不发推送。
- 设置里的推送、邮件、隐身开关保存在 `users/{uid}` 的 `pushEnabled`、`emailUpdates`、`ghostMode`。推送默认开（字段缺失也视为开）。邮件默认关。只有 `emailUpdates === true` 才允许发信，但**没有邮件服务**，打开开关不会发出任何邮件。
- 在线状态用约 45 秒一次的心跳，写在 `users/{uid}.lastSeenAt`。聊天绿点和 “Online” 只在最近 90 秒内心跳时出现；更早则显示 “Online Xm ago”，超过 24 小时不显示。隐身模式不会写入心跳，并会清掉 `lastSeenAt`。对方看到的和离线一样，不会得知你开了隐身。这里不记录 “谁看过你”。

## 你需要做的配置

1. 部署 Functions（区域 `australia-southeast1`）。FCM 使用 Firebase Admin SDK，不需要额外密钥。

   ```bash
   cd functions && npm install && npm run build
   firebase deploy --only functions
   ```

2. Web 推送证书：Firebase 控制台 → 项目设置 → Cloud Messaging → Web Push certificates → 生成密钥对。把公钥写到 `.env.local`：

   ```bash
   VITE_FIREBASE_VAPID_KEY=你的公钥
   ```

   这是公开的 Web Push 密钥，不是私钥。留空时应用内通知仍然可用，浏览器不会注册推送令牌。

3. 服务工作线程在 `public/firebase-messaging-sw.js`。前台 `getToken` 可以注册它。后台通知要在这个文件里用**同一套公开** `VITE_FIREBASE_*` 调用 `firebase.initializeApp`。不要把服务账号或 Gemini 密钥放进去。

4. iOS 推送（APNs）：在 Apple Developer 创建 APNs Auth Key（`.p8`），记下 Key ID 和 Team ID，以及 App 的 Bundle ID。Firebase 控制台 → 项目设置 → Cloud Messaging → Apple 应用配置，上传该密钥。Xcode 打开 Push Notifications，以及 Background Modes → Remote notifications。没有这一步时，网页端令牌流程不受影响，iOS 设备收不到推送。

5. 用户在个人资料 → 设置里打开 Push Notifications 后，浏览器会请求通知权限（仅 Firebase 模式）。拒绝权限或没有 VAPID 密钥时，匹配和消息仍会出现在铃铛里。

6. Email Updates 只保存开关。要真正发信，需要另接邮件服务，并只在 `emailUpdates === true` 时发送同样不含隐私的固定句子。当前没有这家服务。

## 安全边界

- `firestore.rules` 未改。`inboxes` 没有客户端规则，默认拒绝，只有 Functions 能读写。在线时间在私人 `users/{uid}` 上，其他用户读不到，聊天里的在线状态只通过 `getChatPresence` 返回给有共同聊天或匹配的人，响应里没有 `lastSeenAt`，也没有隐身标记。
- 发现筛选在服务器执行。返回的卡片会去掉私人字段（生日、电话、邮箱、角色）。18 岁以下资料不会进入发现列表。
- 残留：规则未收紧时，已登录客户端仍可能直接列出 `profiles`。正式发现路径不再使用那条未筛选的列表，但直接查询仍能绕过年龄和距离筛选。要堵上它，需要以后修改 `firestore.rules`（本步按要求没有改）。
- 推送失败、令牌失效或 FCM 未配置时，匹配、发消息和审核不会失败。失效令牌会从 `pushTokens` 里去掉（最多保留 5 个）。
- 隐身用户不会被写成在线，也不会因为心跳留下浏览记录。发现列表不会因为隐身而隐藏该用户；开关文案仍是匿名浏览。
