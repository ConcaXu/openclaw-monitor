// Vercel Serverless Function示例
module.exports = (req, res) => {
  res.status(200).json({
    message: '🦞 电商价格监控API',
    version: '1.0.0',
    endpoints: {
      demo: '/',
      github: 'https://github.com/ConcaXu/openclaw-monitor',
      documentation: '/README.md'
    },
    features: [
      '淘宝价格监控',
      '京东价格监控', 
      '拼多多价格监控',
      '自动降价提醒',
      '价格历史图表'
    ]
  });
};