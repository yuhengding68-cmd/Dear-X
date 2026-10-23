# 照片认证和 Real 徽章

用户在原来的认证页点照片认证的 Start。应用给出一个随机姿势，用相机在应用内拍摄自拍，上传到私人 Storage 路径 `users/{uid}/verification/{attemptId}.jpg`。Cloud Function 把自拍和该用户已通过审核的资料照片做比对。只有服务器可以把公开资料上的 `verified` 写成 true。徽章只在 `verified === true` 时出现。`firestore.rules` 没有改。这一步不做身份证件或 KYC。

## 比对

- 默认提供者是服务器上的 Gemini 视觉，使用 Functions 密钥 `GEMINI_API_KEY`。密钥不进客户端。
- 同一人、姿势符合、且置信度至少 0.8 才自动通过并点亮徽章。明确不是同一人则拒绝，不点亮。看不清、姿势不符、没有密钥或模型失败时，进入现有管理队列人工决定，不会自动通过。
- 可选提供者：把 Functions 环境变量 `PHOTO_MATCH_PROVIDER` 设为 `rekognition`。这是服务器插件位，准备接 Amazon Rekognition 的 CompareFaces。凭证必须是运行函数的服务账号或密钥管理器，不能放进应用。在适配器接上之前，这个选项只会进入人工审核，不会自动通过。

## 自拍的保存和删除

- 自动通过或拒绝后立刻删除 Storage 里的自拍。
- 人工审核期间，自拍只留在上述私人路径。管理员通过 callable 查看，其他用户读不到。
- 管理员通过或拒绝后删除自拍。
- 审计记录只保留：时间、姿势编号、决定、原因代码、审核人。没有图片、人脸模板或外貌描述。
- 主照片 URL 变化（换第一张已通过的照片、删除或重排导致主照片改变）会清掉 `verified`，必须重新认证。

## 次数

每个账号 24 小时最多 5 次，两次之间至少 60 秒。超限返回 `photo-verify-limited`。

## 你需要做的配置

1. 部署函数和 Storage 规则（本步改了 `storage.rules`，没有改 `firestore.rules`）：

   ```bash
   firebase deploy --only functions,storage
   ```

2. 确认 `GEMINI_API_KEY` 已设为 Functions 密钥。没有密钥时，自拍会进入管理队列，不会自动获得徽章。
3. 若改用 Rekognition，在服务器实现 `FaceMatchProvider` 并设置 `PHOTO_MATCH_PROVIDER=rekognition`。不要把 AWS 密钥放进 Vite。
4. iOS 若改用 Capacitor Camera，需要另行安装原生相机插件。当前网页和演示模式使用 `getUserMedia`。
5. 隐私政策第 7 节是给律师的草稿，说明这可能属于生物识别或类似生物识别的信息。对外发布前请律师审阅同意、APP 3、APP 5、APP 11 和审计记录的保存期限。

## 安全

- 客户端不能写 `profiles` 或 `users`。`verified` 只由函数写入。
- 认证集合 `photoVerifications` 和 `photoVerificationAudit` 没有客户端规则，默认拒绝。
- Storage 只允许本人上传自己的认证文件，不能改、不能删。函数用 Admin SDK 删除。
- 演示模式不调用 Gemini。普通相机画面进入人工审核。单元测试用标记区分通过、拒绝和审核，避免把自拍内容写进审计。
