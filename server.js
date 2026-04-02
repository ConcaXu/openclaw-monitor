#!/usr/bin/env node

/**
 * 电商价格抓取API服务器
 * 使用Puppeteer抓取真实电商价格
 */

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 服务静态文件

// 浏览器实例缓存
let browser = null;

// 初始化浏览器
async function initBrowser() {
  if (!browser) {
    console.log('🦞 启动Puppeteer浏览器...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    console.log('✅ 浏览器已启动');
  }
  return browser;
}

// 获取页面内容
async function fetchPageContent(url, userAgent) {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  try {
    // 设置请求头
    await page.setUserAgent(userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // 设置超时
    await page.setDefaultNavigationTimeout(30000);
    
    // 导航到页面
    console.log(`🌐 访问: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 获取页面内容
    const content = await page.content();
    return content;
    
  } finally {
    await page.close();
  }
}

// 解析淘宝价格
function parseTaobaoPrice(html) {
  const pricePatterns = [
    /"price"\s*:\s*"([\d.]+)"/,
    /"reservePrice"\s*:\s*"([\d.]+)"/,
    /<em class="tb-rmb-num">([\d.]+)<\/em>/,
    /<strong[^>]*>¥\s*([\d.]+)<\/strong>/,
    /"defaultItemPrice"\s*:\s*"([\d.]+)"/,
    /"viewPrice"\s*:\s*"([\d.]+)"/
  ];
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  
  // 尝试更通用的匹配
  const genericMatch = html.match(/¥\s*([\d.,]+)/);
  if (genericMatch && genericMatch[1]) {
    return parseFloat(genericMatch[1].replace(/,/g, ''));
  }
  
  return null;
}

// 解析京东价格
function parseJdPrice(html) {
  const pricePatterns = [
    /"price"\s*:\s*"([\d.]+)"/,
    /"p"\s*:\s*"([\d.]+)"/,
    /<span[^>]*class="price"[^>]*>¥?\s*([\d.]+)<\/span>/i,
    /<strong[^>]*class="p-price"[^>]*>¥?\s*([\d.]+)<\/strong>/i,
    /"jdPrice"\s*:\s*"([\d.]+)"/
  ];
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  
  return null;
}

// 解析拼多多价格
function parsePddPrice(html) {
  const pricePatterns = [
    /"price"\s*:\s*([\d.]+)/,
    /"marketPrice"\s*:\s*([\d.]+)/,
    /"groupPrice"\s*:\s*([\d.]+)/,
    /<span[^>]*class="price"[^>]*>¥?\s*([\d.]+)<\/span>/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  
  return null;
}

// 解析商品标题
function parseProductTitle(html) {
  const titlePatterns = [
    /<title>([^<]+)<\/title>/,
    /"title"\s*:\s*"([^"]+)"/,
    /"name"\s*:\s*"([^"]+)"/
  ];
  
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1]
        .replace(' - 淘宝网', '')
        .replace(' - 天猫Tmall.com', '')
        .replace('【行情 报价 价格 评测】-京东', '')
        .replace(' - 京东', '')
        .replace(' - 拼多多', '')
        .trim();
    }
  }
  
  return '未知商品';
}

// 检测平台
function detectPlatform(url) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  if (hostname.includes('taobao.com') || hostname.includes('tmall.com')) {
    return 'taobao';
  } else if (hostname.includes('jd.com')) {
    return 'jd';
  } else if (hostname.includes('pinduoduo.com') || hostname.includes('yangkeduo.com')) {
    return 'pdd';
  }
  
  return 'unknown';
}

// API端点：检查价格
app.post('/api/check-price', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '请提供商品URL' });
    }
    
    console.log(`🔍 检查价格: ${url}`);
    
    // 检测平台
    const platform = detectPlatform(url);
    
    // 获取页面内容
    const html = await fetchPageContent(url);
    
    // 解析价格
    let price = null;
    switch (platform) {
      case 'taobao':
        price = parseTaobaoPrice(html);
        break;
      case 'jd':
        price = parseJdPrice(html);
        break;
      case 'pdd':
        price = parsePddPrice(html);
        break;
    }
    
    // 解析标题
    const title = parseProductTitle(html);
    
    if (price) {
      console.log(`✅ 找到价格: ¥${price} (${platform})`);
      res.json({
        success: true,
        platform,
        price,
        title,
        currency: 'CNY',
        checkedAt: new Date().toISOString()
      });
    } else {
      console.log('❌ 未找到价格');
      res.json({
        success: false,
        platform,
        price: null,
        title,
        message: '未找到价格信息',
        checkedAt: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ 抓取错误:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '抓取失败，请稍后重试'
    });
  }
});

// API端点：批量检查
app.post('/api/batch-check', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: '请提供商品URL数组' });
    }
    
    if (urls.length > 5) {
      return res.status(400).json({ error: '单次最多检查5个商品' });
    }
    
    console.log(`🔍 批量检查 ${urls.length} 个商品`);
    
    const results = [];
    for (const url of urls) {
      try {
        const platform = detectPlatform(url);
        const html = await fetchPageContent(url);
        const price = platform === 'taobao' ? parseTaobaoPrice(html) :
                     platform === 'jd' ? parseJdPrice(html) :
                     platform === 'pdd' ? parsePddPrice(html) : null;
        const title = parseProductTitle(html);
        
        results.push({
          url,
          platform,
          price,
          title,
          success: price !== null,
          checkedAt: new Date().toISOString()
        });
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error.message,
          checkedAt: new Date().toISOString()
        });
      }
    }
    
    res.json({
      success: true,
      results,
      total: results.length,
      successful: results.filter(r => r.success).length
    });
    
  } catch (error) {
    console.error('❌ 批量检查错误:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '电商价格抓取API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 首页
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 API端点:`);
  console.log(`   POST /api/check-price - 检查单个商品价格`);
  console.log(`   POST /api/batch-check - 批量检查价格`);
  console.log(`   GET  /api/health      - 健康检查`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🔄 收到关闭信号，清理资源...');
  if (browser) {
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
  process.exit(0);
});

module.exports = app;