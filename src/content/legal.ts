import type { Locale } from '../types';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

const terms: Record<Locale, LegalSection[]> = {
  en: [
    {
      heading: '1. What DearX is',
      paragraphs: [
        'DearX is a free dating service for adults in Australia, including Chinese-speaking residents and students, plus a separate creator section.',
        'A chat opens only after a mutual match. Chat is free. DearX does not sell the ability to start a conversation, and it does not rank people by appearance.',
      ],
    },
    {
      heading: '2. You must be 18 or older',
      paragraphs: [
        'You must enter a date of birth. If that date is under 18 on the Australia/Sydney calendar, the account is stopped and is not given a dating profile.',
        'Creators must confirm they are 18 or older and complete an identity check before posting. The identity-check vendor in this build is a stub.',
      ],
    },
    {
      heading: '3. Dating and creators are separate',
      paragraphs: [
        'Creator pages do not show your distance or location and do not offer a message button for meeting up.',
        'Creators must not sell chat time, companionship, dates, escorting, or in-person meetups. Paid features are limited to reviewed, non-adult subscriptions and posts.',
      ],
    },
    {
      heading: '4. Content',
      paragraphs: [
        'Sexual content, nudity, pornography, hate, harassment, violence, and anything involving minors are forbidden.',
        'Creator posts stay pending until a person reviews them. A post may be rejected by automated moderation or by that review.',
      ],
    },
    {
      heading: '5. Purchases and payouts',
      paragraphs: [
        'Subscriptions and paid posts are meant to be billed as in-app purchases through Apple or Google. This build uses a server-side stub and does not charge a real store account.',
        'Creator balances can change only on the server. Payouts are meant to go through a licensed provider such as Airwallex. The provider call in this build is a stub and does not transfer money.',
      ],
    },
    {
      heading: '6. Safety, deletion, and export',
      paragraphs: [
        'You can report or block another person. Reports are stored with a status. You cannot mark your own report as resolved.',
        'You can export your data and delete your account in Settings. Deletion removes your profile, messages, and creator posts. Safety reports may be kept without your name where the law allows.',
      ],
    },
    {
      heading: '7. Contact',
      paragraphs: ['Questions about these terms: legal@dearx.app. Safety reports: safety@dearx.app.'],
    },
  ],
  'zh-CN': [
    {
      heading: '1. DearX 是什么',
      paragraphs: [
        'DearX 是面向澳大利亚成年人的免费约会服务，包括说中文的居民和学生，另外还有一个独立的创作者区。',
        '只有双向匹配后才会打开聊天，而且聊天免费。DearX 不出售开聊资格，也不按外貌给人排名。',
      ],
    },
    {
      heading: '2. 必须年满 18 岁',
      paragraphs: [
        '你必须填写出生日期。如果按澳大利亚悉尼的日历未满 18 岁，账号会被停止，也不会建立约会资料。',
        '创作者发帖前必须确认年满 18 岁并完成身份核验。这个版本里的身份核验服务商是占位实现。',
      ],
    },
    {
      heading: '3. 约会和创作者区是分开的',
      paragraphs: [
        '创作者页面不显示距离或位置，也没有约见面的私信按钮。',
        '创作者不得出售聊天时间、陪伴、约会、伴游或线下见面。付费功能仅限于经过审核的非成人订阅和帖子。',
      ],
    },
    {
      heading: '4. 内容',
      paragraphs: [
        '禁止性内容、裸露、色情、仇恨、骚扰、暴力，以及任何涉及未成年人的内容。',
        '创作者帖子在人工审核前保持待审核。自动审核或人工审核都可以拒绝一篇帖子。',
      ],
    },
    {
      heading: '5. 购买和提现',
      paragraphs: [
        '订阅和付费帖子应按 Apple 或 Google 的应用内购买来收费。这个版本使用服务器端占位，不会向真实商店账号扣款。',
        '创作者余额只能在服务器上变动。提现应通过 Airwallex 这类持牌服务商。这个版本里的服务商调用是占位，不会真正转账。',
      ],
    },
    {
      heading: '6. 安全、删除和导出',
      paragraphs: [
        '你可以举报或拉黑他人。举报会连同状态一起保存。你不能把自己的举报标成已处理。',
        '你可以在设置里导出数据并删除账号。删除会移除资料、消息和创作者帖子。在法律允许时，安全举报可能会在去掉姓名后保留。',
      ],
    },
    {
      heading: '7. 联系',
      paragraphs: ['条款问题：legal@dearx.app。安全举报：safety@dearx.app。'],
    },
  ],
};

const privacy: Record<Locale, LegalSection[]> = {
  en: [
    {
      heading: '1. Who this describes',
      paragraphs: [
        'This draft explains what a finished DearX service would collect. It is not a notice that has been reviewed for the Australian Privacy Act.',
      ],
    },
    {
      heading: '2. Data we expect to hold',
      paragraphs: [
        'Account data: phone number or sign-in provider, date of birth, display name, and the language you choose.',
        'Dating profile: age, city, bio, interests, and an optional photo. Date of birth, phone, and email are not placed on the dating card other people see.',
        'Creator profile: display name, bio, photo, identity-check status, and prices. It does not include a city or distance.',
        'Messages are stored in a subcollection under each chat. Reports, blocks, purchases, and payout records are separate.',
      ],
    },
    {
      heading: '3. Why',
      paragraphs: [
        'We use this data to run mutual matching, free chat, safety review, creator publishing, and the account export and deletion tools required by App Store guideline 5.1.1.',
        'Text can be sent to a moderation model running in Cloud Functions. The Gemini API key is not part of the app that ships to phones or browsers.',
      ],
    },
    {
      heading: '4. Access, export, and deletion',
      paragraphs: [
        'You can download a JSON export of your account from Settings.',
        'You can delete your account from Settings. Deletion removes your profile and messages. Purchase rows and reports may be kept in a form that no longer names you, where a record is still required.',
      ],
    },
    {
      heading: '5. Children',
      paragraphs: ['DearX is not for anyone under 18. A date of birth under 18 does not become a usable profile.'],
    },
    {
      heading: '6. Contact',
      paragraphs: ['Privacy questions: privacy@dearx.app.'],
    },
    {
      heading: '7. Photo verification (draft for counsel)',
      paragraphs: [
        'Photo verification asks the person to take a selfie in the app while following a random pose. The image is stored on a private path and compared on the server with that person’s approved profile photos. The comparison can use Gemini vision or a server-side face-comparison provider such as Amazon Rekognition. Keys stay on the server and are not in the app.',
        'The selfie is deleted after an automatic decision or an admin decision. What remains is the result and an audit record: time, pose id, decision, and reviewer id. The selfie, a face template, and a written description of the face are not kept.',
        'This may be biometric information or biometric-like information under the Privacy Act 1988 (Cth) and any applicable state biometric or surveillance law. This section is a product note for a lawyer. It is not a notice approved for publication. Counsel should review consent, APP 3, APP 5, and APP 11, how long the audit record is kept, and whether a face-comparison vendor is a disclosure to a third party.',
        'The Real badge appears only after the server sets verified. Changing the main profile photo clears it until the person verifies again. The selfie is not shown to other users and is not used to rank appearance. This step does not collect an identity document.',
      ],
    },
  ],
  'zh-CN': [
    {
      heading: '1. 这份说明写给谁',
      paragraphs: ['这份草稿说明正式的 DearX 服务预计会保存哪些信息。它还没有按澳大利亚隐私法完成律师审核。'],
    },
    {
      heading: '2. 预计保存的数据',
      paragraphs: [
        '账号数据：手机号或登录提供方、出生日期、显示名称，以及你选择的语言。',
        '约会资料：年龄、城市、简介、兴趣和可选照片。其他人看到的约会卡不包含出生日期、手机号或电子邮箱。',
        '创作者资料：显示名称、简介、照片、身份核验状态和价格。不包含城市或距离。',
        '消息保存在每个聊天下面的子集合里。举报、拉黑、购买和提现记录是分开的。',
      ],
    },
    {
      heading: '3. 用途',
      paragraphs: [
        '这些数据用于双向匹配、免费聊天、安全审核、创作者发布，以及 App Store 准则 5.1.1 要求的账号导出和删除。',
        '文字可能会送到 Cloud Functions 里的审核模型。Gemini API 密钥不会放进发给手机或浏览器的应用里。',
      ],
    },
    {
      heading: '4. 访问、导出和删除',
      paragraphs: [
        '你可以在设置里下载自己的账号 JSON 导出。',
        '你可以在设置里删除账号。删除会移除资料和消息。如果仍需要留存记录，购买和举报可能会以不再包含你姓名的形式保留。',
      ],
    },
    {
      heading: '5. 未成年人',
      paragraphs: ['DearX 不面向未满 18 岁的人。未满 18 岁的出生日期不会变成可用的资料。'],
    },
    {
      heading: '6. 联系',
      paragraphs: ['隐私问题：privacy@dearx.app。'],
    },
    {
      heading: '7. 照片认证（供律师审阅的草稿）',
      paragraphs: [
        '照片认证会请用户在应用内按一个随机姿势拍摄自拍。图片保存在私人路径，由服务器与该用户已通过审核的资料照片比对。比对可以使用 Gemini 视觉，或服务器上的人脸比对服务（例如 Amazon Rekognition）。密钥只在服务器上，不会放进应用。',
        '自动决定或管理员决定之后会删除自拍。留下的是结果和审计记录：时间、姿势编号、决定和审核人编号。不保留自拍、人脸模板，也不保留对人脸的文字描述。',
        '这些信息在《1988 年隐私法》（联邦）以及适用的州生物识别或监控法律下，可能属于生物识别信息或类似生物识别的信息。本节是给律师的产品说明，不是已经批准对外发布的通知。律师应审查同意、APP 3、APP 5 和 APP 11、审计记录保存多久，以及人脸比对服务商是否构成向第三方披露。',
        '只有服务器写下 verified 之后才会显示 Real 徽章。更换主照片会清掉徽章，直到用户重新认证。自拍不会给其他用户看，也不会用来给外貌打分。这一步不收集身份证件。',
      ],
    },
  ],
};

export function legalSections(doc: 'privacy' | 'terms', locale: Locale): LegalSection[] {
  return doc === 'privacy' ? privacy[locale] : terms[locale];
}
