# 举报、封禁和支持工单

这一步没有改 `firestore.rules`。客户端不能改举报状态，也不能自己写审核记录或支持工单。这些写入都走 Cloud Functions（Admin SDK）。

## 你要做的配置

1. 部署函数（含登录拦截 `gateSignIn`）。区域是 `australia-southeast1`。

```bash
cd functions && npm install && npm run build && cd ..
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

Firebase 控制台里要允许 Auth 的 **Blocking functions**（`beforeUserSignedIn`）。没有部署这个函数时，已封禁用户仍可能换到一张还没过期的登录令牌，直到令牌失效。函数部署之后，暂停和封禁会禁用 Auth 用户并撤销刷新令牌。

2. 把管理员角色写在控制台，不要写在客户端：`users/{uid}.role = admin`。客户端规则本来就不能改 `users`。管理员第一次打开审核队列时，应用会调用 `refreshAdminClaim`，把这个角色抄到自定义声明 `admin: true`。之后的审核操作同时检查声明和 Firestore 角色。你在控制台拿掉 `admin` 之后，声明还在也会立刻被拒绝。

3. 支持邮箱不是密钥。在 `.env.local` 设置 `VITE_SUPPORT_EMAIL`，这是帮助页上给用户看的地址。不设置时显示占位 `safety@dearx.app`。可选：在 Functions 环境变量里设置同名收件箱 `SUPPORT_EMAIL`，作为客户端没传合法邮箱时的后备。两处请写成同一个你能收到信的地址。

4. 注册资料的文字和可选 https 照片走 `completeOnboarding`，需要已经设置的 `GEMINI_API_KEY`。没有密钥或 Gemini 结果读不出来时，文字和照片保持未公开（失败即关闭）。演示模式只用关键词，不调用 Gemini。

## 审核队列里有什么

打开资料 → 设置 → 审核队列。队列列出未结案和已处理的举报，带举报当时的资料或消息快照、状态时间，以及 24 小时 SLA（仍为 open 或 reviewing 且超过 24 小时会标成逾期）。

操作：驳回、警告、移除内容、暂停、封禁、恢复。

- 警告：账号可以继续用，资料上会看到提示。
- 移除内容：消息改成 `[removed]`；资料则清掉简介、兴趣和公开照片。
- 暂停 / 封禁：公开 `profiles/{uid}` 挪到私有用户的 `heldProfile` 后删除，发现页不再列出。Auth 用户被禁用。登录、喜欢、发消息、再举报、提交支持工单都会被函数拒绝。
- 恢复：写回被扣下的公开资料，并重新启用 Auth 用户。

每次操作在 `moderationAudit` 记一条。这个集合没有客户端规则，默认拒绝。举报状态和时间写在 `reports` 上。支持工单在 `supportTickets`。

举报人在原来的「帮助与支持」里看到自己的举报状态和是否超过 24 小时。这个列表不带管理员备注，也不带快照。联系支持会在同一张卡片里提交应用内工单，并显示上面的支持邮箱。

## 安全边界（规则没改，所以这些仍然成立）

- 审核动作不能靠客户端改 Firestore。`reports` 的 update 本来就是 false。
- 自定义声明只能由函数根据 Firestore 里的 `role` 签发。客户端标志不算管理员。
- 发现页靠删除公开资料隐藏被暂停或封禁的人。发消息和喜欢靠函数检查 `accountStanding`。登录靠 Auth `disabled` 加上 `beforeUserSignedIn`。
- 现有规则仍允许举报人读取自己的举报文档。不要把内部备注写进 `reports`。备注只在 `moderationAudit`。
- 在刷新令牌被撤销、ID 令牌过期之前，一个已经登录的客户端仍可能按现有规则直接读 Firestore。这次不能改规则，所以这是残留风险。暂停和封禁会立刻撤销刷新令牌并禁用账号，缩短这段窗口。
