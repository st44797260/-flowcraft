// 内置模板目录（硬编码在前端，后续可迁移到 templates 表）
// chain 中的每个节点：type 必须是注册过的节点类型（注意不能用 'output'，
// 与 React Flow 内置类型撞名），name/config 是模板预填的节点参数。

export const TEMPLATE_CATEGORIES = ['营销', '运营', '数据分析', '内容创作', '客服']

const TEMPLATES = [
  {
    id: 'competitor-price-monitor',
    name: '竞品价格监控',
    description: '定时抓取竞品定价页，AI 分析价格趋势，发现变化时邮件提醒。',
    category: '数据分析',
    usageCount: 356,
    chain: [
      { type: 'trigger', name: '每天 09:00 定时触发', config: { schedule: '每天 09:00' } },
      { type: 'scrape', name: '抓取竞品定价页', config: { url: 'https://competitor.example.com/pricing' } },
      { type: 'condition', name: '价格是否有变化', config: { expression: '与上次抓取结果对比' } },
      { type: 'ai', name: 'AI 分析价格趋势', config: { model: 'gpt-4o-mini', prompt: '对比历次价格，分析竞品定价策略与趋势' } },
      { type: 'outputNode', name: '邮件提醒', config: { channel: 'email', to: 'me@example.com' } },
    ],
  },
  {
    id: 'industry-news-daily',
    name: '行业新闻日报',
    description: '每天早上抓取行业新闻，AI 去重筛选并生成中文摘要日报。',
    category: '内容创作',
    usageCount: 289,
    chain: [
      { type: 'trigger', name: '每天 08:00 定时触发', config: { schedule: '每天 08:00' } },
      { type: 'scrape', name: '抓取行业新闻', config: { url: 'https://news.example.com', selector: '.article-list' } },
      { type: 'ai', name: '生成新闻摘要', config: { model: 'gpt-4o-mini', prompt: '筛选重要的 5 条新闻并生成中文摘要' } },
      { type: 'outputNode', name: '邮件发送日报', config: { channel: 'email' } },
    ],
  },
  {
    id: 'customer-feedback-classifier',
    name: '客户反馈分类',
    description: '自动对新反馈做主题分类与情感分析，负面反馈直接转人工跟进。',
    category: '客服',
    usageCount: 214,
    chain: [
      { type: 'trigger', name: '收到新反馈时触发', config: { event: 'feedback.created' } },
      { type: 'ai', name: '分类与情感分析', config: { model: 'gpt-4o-mini', prompt: '对反馈做主题分类并判断情感倾向（正面/负面/中性）' } },
      { type: 'condition', name: '是否为负面反馈', config: { expression: '情感倾向为负面' } },
      { type: 'outputNode', name: '转人工跟进', config: { channel: 'webhook' } },
    ],
  },
  {
    id: 'social-media-poster',
    name: '社交媒体自动发帖',
    description: '按排期自动生成社交媒体文案并发布，保持账号活跃度。',
    category: '营销',
    usageCount: 178,
    chain: [
      { type: 'trigger', name: '每周三 10:00 触发', config: { schedule: '每周三 10:00' } },
      { type: 'ai', name: '生成社交媒体文案', config: { model: 'gpt-4o-mini', prompt: '根据本周热点生成一条轻松友好的推广文案' } },
      { type: 'outputNode', name: '发布到社交账号', config: { channel: 'social' } },
    ],
  },
  {
    id: 'contract-clause-extractor',
    name: '合同关键条款提取',
    description: '上传新合同后自动提取金额、期限、违约责任等关键条款并归档。',
    category: '运营',
    usageCount: 156,
    chain: [
      { type: 'trigger', name: '上传新合同时触发', config: { event: 'contract.uploaded' } },
      { type: 'ai', name: '提取关键条款', config: { model: 'gpt-4o-mini', prompt: '提取合同中的金额、期限、违约责任与终止条款' } },
      { type: 'outputNode', name: '归档到文档库', config: { channel: 'doc' } },
    ],
  },
  {
    id: 'weekly-report-generator',
    name: '周报自动生成',
    description: '每周五拉取项目管理系统数据，AI 汇总生成本周周报发团队。',
    category: '运营',
    usageCount: 143,
    chain: [
      { type: 'trigger', name: '每周五 17:00 触发', config: { schedule: '每周五 17:00' } },
      { type: 'scrape', name: '拉取项目动态', config: { url: 'https://pm.example.com/api/weekly' } },
      { type: 'ai', name: '生成本周周报', config: { model: 'gpt-4o-mini', prompt: '按“进展/风险/下周计划”三段生成本周周报' } },
      { type: 'outputNode', name: '发送给团队', config: { channel: 'email' } },
    ],
  },
  {
    id: 'web-change-alert',
    name: '网页内容变更提醒',
    description: '高频监控目标页面，内容一旦变更立即推送通知。',
    category: '数据分析',
    usageCount: 121,
    chain: [
      { type: 'trigger', name: '每 30 分钟触发', config: { schedule: '每 30 分钟' } },
      { type: 'scrape', name: '监控目标页面', config: { url: 'https://target.example.com' } },
      { type: 'condition', name: '内容是否有变更', config: { expression: '与上次快照对比' } },
      { type: 'outputNode', name: '推送变更通知', config: { channel: 'webhook' } },
    ],
  },
  {
    id: 'email-triage',
    name: '邮件自动分类归档',
    description: '新邮件自动识别意图并分类，需要人工处理的及时通知。',
    category: '客服',
    usageCount: 98,
    chain: [
      { type: 'trigger', name: '收到新邮件时触发', config: { event: 'email.received' } },
      { type: 'ai', name: '邮件意图分类', config: { model: 'gpt-4o-mini', prompt: '将邮件分类为咨询/投诉/合作/其他，并生成一句话摘要' } },
      { type: 'condition', name: '是否需要人工处理', config: { expression: '类别为投诉或合作' } },
      { type: 'outputNode', name: '归档并通知', config: { channel: 'email' } },
    ],
  },
  {
    id: 'auto-data-report',
    name: '数据报表自动生成',
    description: '每月初自动汇总业务数据，AI 生成图文分析报告。',
    category: '数据分析',
    usageCount: 87,
    chain: [
      { type: 'trigger', name: '每月 1 日 09:00 触发', config: { schedule: '每月 1 日 09:00' } },
      { type: 'ai', name: '汇总分析数据', config: { model: 'gpt-4o-mini', prompt: '对本月核心指标做环比分析并给出结论与建议' } },
      { type: 'outputNode', name: '生成 PDF 报表', config: { channel: 'doc' } },
    ],
  },
  {
    id: 'multilingual-translator',
    name: '多语言内容翻译',
    description: '新内容发布后自动翻译为多语言版本并同步到各渠道。',
    category: '内容创作',
    usageCount: 76,
    chain: [
      { type: 'trigger', name: '新内容发布时触发', config: { event: 'content.published' } },
      { type: 'ai', name: '翻译为多语言版本', config: { model: 'gpt-4o-mini', prompt: '将内容翻译为英文、日文、西班牙语，保持语气一致' } },
      { type: 'outputNode', name: '发布多语言版本', config: { channel: 'social' } },
    ],
  },
]

export default TEMPLATES
