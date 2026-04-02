// Vercel Serverless Function - 价格检查API
const { URL } = require('url');

// 简单的价格解析函数（避免Puppeteer依赖）
function parsePriceFromHtml(html, platform) {
  let price = null;
  
  if (platform === 'taobao') {
    const patterns = [
      /"price"\s*:\s*"([\d.]+)"/,
      /"reservePrice"\s*:\s*"([\d.]+)"/,
      /<em class="tb-rmb-num">([\d.]+)<\/em>/,
      /<strong[^>]*>¥\s*([\d.]+)<\/strong>/
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        price = parseFloat(match[1]);
        break;
      }
    }
  } else if (platform === 'jd') {
    const patterns = [
      /"price"\s*:\s*"([\d.]+)"/,
      /"p"\s*:\s*"([\d.]+)"/,
      /<span[^>]*class="price"[^>]*>¥?\s*([\d.]+)<\/span>/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        price = parseFloat(match[1]);
        break;
      }
    }
  }
  
  // 通用匹配
  if (!price) {
    const genericMatch = html.match(/¥\s*([\d.,]+)/);
    if (genericMatch && genericMatch[1]) {
      price = parseFloat(genericMatch[1].replace(/,/g, ''));
    }
  }
  
  return price;
}

function parseTitleFromHtml(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1]
      .replace(' - 淘宝网', '')
      .replace(' - 天猫Tmall.com', '')
      .replace('【行情 报价 价格 评测】-京东', '')
      .replace(' - 京东', '')
      .trim();
  }
  return '未知商品';
}

function detectPlatform(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname.includes('taobao.com') || hostname.includes('tmall.com')) {
      return 'taobao';
    } else if (hostname.includes('jd.com')) {
      return 'jd';
    } else if (hostname.includes('pinduoduo.com') || hostname.includes('yangkeduo.com')) {
      return 'pdd';
    }
  } catch (error) {
    // URL解析失败
  }
  
  return 'unknown';
}

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }
  
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '请提供商品URL' });
    }
    
    console.log(`🔍 检查价格: ${url}`);
    
    // 检测平台
    const platform = detectPlatform(url);
    
    // 使用fetch获取页面（Vercel环境支持）
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // 解析价格和标题
    const price = parsePriceFromHtml(html, platform);
    const title = parseTitleFromHtml(html);
    
    if (price) {
      console.log(`✅ 找到价格: ¥${price} (${platform})`);
      return res.json({
        success: true,
        platform,
        price,
        title,
        currency: 'CNY',
        checkedAt: new Date().toISOString()
      });
    } else {
      console.log('❌ 未找到价格，返回模拟数据');
      // 如果找不到真实价格，返回模拟数据（演示用）
      const mockPrice = Math.random() * 500 + 50;
      return res.json({
        success: true,
        platform,
        price: parseFloat(mockPrice.toFixed(2)),
        title: title || '模拟商品',
        isMock: true,
        currency: 'CNY',
        checkedAt: new Date().toISOString(),
        message: '真实价格抓取失败，返回模拟数据'
      });
    }
    
  } catch (error) {
    console.error('❌ 抓取错误:', error.message);
    
    // 出错时返回模拟数据
    const mockPrice = Math.random() * 500 + 50;
    return res.json({
      success: true,
      platform: 'unknown',
      price: parseFloat(mockPrice.toFixed(2)),
      title: '模拟商品（抓取失败）',
      isMock: true,
      currency: 'CNY',
      checkedAt: new Date().toISOString(),
      error: error.message,
      message: '抓取失败，返回模拟数据'
    });
  }
};