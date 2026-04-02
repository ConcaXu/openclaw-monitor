#!/usr/bin/env node

/**
 * 简单价格获取器 - 使用curl和正则表达式获取价格
 * 避免复杂的Playwright依赖问题
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SimplePriceFetcher {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async fetchPrice(url) {
    console.log(`获取价格: ${url}`);
    
    try {
      // 使用curl获取页面内容
      const { stdout } = await execPromise(
        `curl -s -L -H "User-Agent: ${this.userAgent}" "${url}"`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
      );
      
      const html = stdout;
      
      // 根据URL判断平台
      if (url.includes('taobao.com') || url.includes('tmall.com')) {
        return this.parseTaobaoPrice(html, url);
      } else if (url.includes('jd.com')) {
        return this.parseJdPrice(html, url);
      } else if (url.includes('pinduoduo.com')) {
        return this.parsePddPrice(html, url);
      } else {
        // 通用价格解析
        return this.parseGenericPrice(html, url);
      }
      
    } catch (error) {
      console.error(`获取页面失败: ${error.message}`);
      // 返回模拟数据
      return {
        price: Math.random() * 100 + 50,
        title: '模拟商品',
        success: false,
        isMock: true
      };
    }
  }

  parseTaobaoPrice(html, url) {
    let price = 0;
    let title = '淘宝商品';
    
    // 尝试多种价格选择器
    const pricePatterns = [
      /"price":"([\d.]+)"/,
      /"reservePrice":"([\d.]+)"/,
      /"auctionPrice":"([\d.]+)"/,
      /<em class="tb-rmb-num">([\d.]+)<\/em>/,
      /<strong[^>]*>¥([\d.]+)<\/strong>/,
      /"defaultItemPrice":"([\d.]+)"/
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        price = parseFloat(match[1]);
        break;
      }
    }
    
    // 提取标题
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1]
        .replace(' - 淘宝网', '')
        .replace(' - 天猫Tmall.com', '')
        .trim();
    }
    
    return {
      price: price || this.generateMockPrice(),
      title: title || '淘宝商品',
      success: price > 0,
      isMock: price === 0
    };
  }

  parseJdPrice(html, url) {
    let price = 0;
    let title = '京东商品';
    
    // 京东价格模式
    const pricePatterns = [
      /"price":"([\d.]+)"/,
      /"p":"([\d.]+)"/,
      /<span[^>]*class="price"[^>]*>¥?([\d.]+)<\/span>/i,
      /<strong[^>]*class="p-price"[^>]*>¥?([\d.]+)<\/strong>/i,
      /"jdPrice":"([\d.]+)"/
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        price = parseFloat(match[1]);
        break;
      }
    }
    
    // 提取标题
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1]
        .replace('【行情 报价 价格 评测】-京东', '')
        .replace(' - 京东', '')
        .trim();
    }
    
    return {
      price: price || this.generateMockPrice(),
      title: title || '京东商品',
      success: price > 0,
      isMock: price === 0
    };
  }

  parsePddPrice(html, url) {
    let price = 0;
    let title = '拼多多商品';
    
    // 拼多多价格模式
    const pricePatterns = [
      /"price":([\d.]+)/,
      /"marketPrice":([\d.]+)/,
      /"groupPrice":([\d.]+)/,
      /<span[^>]*class="price"[^>]*>¥?([\d.]+)<\/span>/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        price = parseFloat(match[1]);
        break;
      }
    }
    
    // 提取标题
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1]
        .replace(' - 拼多多', '')
        .trim();
    }
    
    return {
      price: price || this.generateMockPrice(),
      title: title || '拼多多商品',
      success: price > 0,
      isMock: price === 0
    };
  }

  parseGenericPrice(html, url) {
    let price = 0;
    let title = '商品';
    
    // 通用价格匹配
    const pricePatterns = [
      /¥\s*([\d.,]+)/,
      /￥\s*([\d.,]+)/,
      /价格[：:]\s*¥?\s*([\d.,]+)/,
      /price[：:]\s*¥?\s*([\d.,]+)/i,
      /"price"\s*:\s*"([\d.]+)"/,
      /'price'\s*:\s*'([\d.]+)'/
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const priceStr = match[1].replace(/,/g, '');
        price = parseFloat(priceStr);
        if (price > 0) break;
      }
    }
    
    // 提取标题
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    return {
      price: price || this.generateMockPrice(),
      title: title || '商品',
      success: price > 0,
      isMock: price === 0
    };
  }

  generateMockPrice() {
    // 生成合理的模拟价格
    const basePrices = [99, 199, 299, 399, 499, 599, 699, 799, 899, 999];
    const base = basePrices[Math.floor(Math.random() * basePrices.length)];
    const variation = Math.random() * 100 - 50; // -50到+50的波动
    return Math.max(1, base + variation);
  }
}

// 测试函数
async function test() {
  const fetcher = new SimplePriceFetcher();
  
  const testUrls = [
    'https://item.taobao.com/item.htm?id=123456789',
    'https://item.jd.com/10012345678.html',
    'https://yangkeduo.com/goods.html?goods_id=123456789'
  ];
  
  for (const url of testUrls) {
    console.log(`\n测试URL: ${url}`);
    const result = await fetcher.fetchPrice(url);
    console.log('结果:', {
      price: result.price,
      title: result.title.substring(0, 50) + '...',
      success: result.success,
      isMock: result.isMock
    });
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 如果直接运行则执行测试
if (require.main === module) {
  test().catch(console.error);
}

module.exports = SimplePriceFetcher;