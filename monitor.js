#!/usr/bin/env node

/**
 * 电商价格监控主程序
 * 支持淘宝、京东、拼多多价格监控
 */

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const SimplePriceFetcher = require('./simple-fetcher.js');

// 配置
const CONFIG = {
  checkInterval: '*/30 * * * *', // 每30分钟检查一次
  dataDir: path.join(__dirname, 'data'),
  logDir: path.join(__dirname, 'logs'),
  platforms: ['taobao', 'jd', 'pdd']
};

// 确保目录存在
[CONFIG.dataDir, CONFIG.logDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 商品数据库
const PRODUCTS_DB = path.join(CONFIG.dataDir, 'products.json');
const PRICE_HISTORY_DB = path.join(CONFIG.dataDir, 'price-history.json');

class PriceMonitor {
  constructor() {
    this.products = this.loadProducts();
    this.priceHistory = this.loadPriceHistory();
    this.isRunning = false;
    this.fetcher = new SimplePriceFetcher();
  }

  loadProducts() {
    try {
      if (fs.existsSync(PRODUCTS_DB)) {
        return JSON.parse(fs.readFileSync(PRODUCTS_DB, 'utf8'));
      }
    } catch (error) {
      console.error('加载商品数据库失败:', error);
    }
    return [];
  }

  loadPriceHistory() {
    try {
      if (fs.existsSync(PRICE_HISTORY_DB)) {
        return JSON.parse(fs.readFileSync(PRICE_HISTORY_DB, 'utf8'));
      }
    } catch (error) {
      console.error('加载价格历史失败:', error);
    }
    return {};
  }

  saveProducts() {
    try {
      fs.writeFileSync(PRODUCTS_DB, JSON.stringify(this.products, null, 2));
    } catch (error) {
      console.error('保存商品数据库失败:', error);
    }
  }

  savePriceHistory() {
    try {
      fs.writeFileSync(PRICE_HISTORY_DB, JSON.stringify(this.priceHistory, null, 2));
    } catch (error) {
      console.error('保存价格历史失败:', error);
    }
  }

  async addProduct(url, name = '', targetPrice = 0) {
    const product = {
      id: Date.now().toString(),
      url,
      name: name || this.extractProductNameFromUrl(url),
      platform: this.detectPlatform(url),
      currentPrice: 0,
      lowestPrice: Infinity,
      highestPrice: 0,
      targetPrice,
      lastChecked: null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.products.push(product);
    this.saveProducts();
    
    // 立即检查一次价格
    await this.checkProductPrice(product);
    
    return product;
  }

  extractProductNameFromUrl(url) {
    // 简单地从URL提取商品信息
    if (url.includes('taobao.com')) return '淘宝商品';
    if (url.includes('jd.com')) return '京东商品';
    if (url.includes('pinduoduo.com')) return '拼多多商品';
    return '未知商品';
  }

  detectPlatform(url) {
    if (url.includes('taobao.com') || url.includes('tmall.com')) return 'taobao';
    if (url.includes('jd.com')) return 'jd';
    if (url.includes('pinduoduo.com')) return 'pdd';
    return 'unknown';
  }

  async checkProductPrice(product) {
    console.log(`检查商品价格: ${product.name} (${product.url})`);
    
    const result = await this.fetcher.fetchPrice(product.url);
    const price = result.price;
    const title = result.title || product.name;
    
    if (result.isMock) {
      console.log('⚠️ 使用模拟价格（实际抓取失败）');
    }
    
    // 更新商品信息
    const now = new Date().toISOString();
    product.currentPrice = price;
    product.name = title;
    product.lastChecked = now;
    
    if (price < product.lowestPrice) {
      product.lowestPrice = price;
    }
    
    if (price > product.highestPrice) {
      product.highestPrice = price;
    }
    
    // 保存价格历史
    if (!this.priceHistory[product.id]) {
      this.priceHistory[product.id] = [];
    }
    
    this.priceHistory[product.id].push({
      price,
      timestamp: now,
      productName: title
    });
    
    // 保留最近100条记录
    if (this.priceHistory[product.id].length > 100) {
      this.priceHistory[product.id] = this.priceHistory[product.id].slice(-100);
    }
    
    this.saveProducts();
    this.savePriceHistory();
    
    // 检查是否需要发送提醒
    if (product.targetPrice > 0 && price <= product.targetPrice) {
      await this.sendNotification(product, price);
    }
    
    return { price, title };
  }

  async sendNotification(product, currentPrice) {
    const message = `🎉 价格提醒！\n\n商品：${product.name}\n当前价格：${currentPrice}元\n目标价格：${product.targetPrice}元\n链接：${product.url}\n\n立即购买！`;
    
    console.log('发送通知:', message);
    
    // 这里可以集成微信、邮件、Telegram等通知方式
    // 暂时先记录到日志
    this.logNotification(product, currentPrice, message);
  }

  logNotification(product, price, message) {
    const logFile = path.join(CONFIG.logDir, 'notifications.log');
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    
    fs.appendFileSync(logFile, logEntry, 'utf8');
  }

  async checkAllProducts() {
    console.log(`开始检查 ${this.products.length} 个商品...`);
    
    for (const product of this.products.filter(p => p.isActive)) {
      try {
        await this.checkProductPrice(product);
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`检查商品失败 ${product.name}:`, error.message);
      }
    }
    
    console.log('所有商品检查完成');
  }

  start() {
    if (this.isRunning) {
      console.log('监控已经在运行中');
      return;
    }
    
    console.log('启动价格监控服务...');
    console.log(`检查间隔: ${CONFIG.checkInterval}`);
    
    // 立即检查一次
    this.checkAllProducts();
    
    // 设置定时任务
    this.cronJob = cron.schedule(CONFIG.checkInterval, () => {
      console.log('定时检查开始...');
      this.checkAllProducts();
    });
    
    this.isRunning = true;
    console.log('价格监控服务已启动');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    this.isRunning = false;
    console.log('价格监控服务已停止');
  }

  listProducts() {
    return this.products.map(p => ({
      id: p.id,
      name: p.name,
      platform: p.platform,
      currentPrice: p.currentPrice,
      lowestPrice: p.lowestPrice,
      targetPrice: p.targetPrice,
      lastChecked: p.lastChecked,
      isActive: p.isActive
    }));
  }

  getPriceHistory(productId) {
    return this.priceHistory[productId] || [];
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalProducts: this.products.length,
      activeProducts: this.products.filter(p => p.isActive).length,
      products: this.listProducts(),
      summary: {
        totalValue: this.products.reduce((sum, p) => sum + p.currentPrice, 0),
        averagePrice: this.products.length > 0 ? 
          this.products.reduce((sum, p) => sum + p.currentPrice, 0) / this.products.length : 0,
        priceChanges24h: this.calculatePriceChanges24h()
      }
    };
    
    return report;
  }

  calculatePriceChanges24h() {
    // 计算24小时内的价格变化
    const changes = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const productId in this.priceHistory) {
      const history = this.priceHistory[productId];
      const recentPrices = history.filter(h => new Date(h.timestamp) > twentyFourHoursAgo);
      
      if (recentPrices.length >= 2) {
        const firstPrice = recentPrices[0].price;
        const lastPrice = recentPrices[recentPrices.length - 1].price;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        changes.push({
          productId,
          change: change.toFixed(2) + '%',
          direction: change > 0 ? '上涨' : '下跌'
        });
      }
    }
    
    return changes;
  }
}

// CLI接口
async function main() {
  const monitor = new PriceMonitor();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'add':
      const url = args[1];
      const name = args[2] || '';
      const targetPrice = parseFloat(args[3]) || 0;
      
      if (!url) {
        console.error('请提供商品URL');
        process.exit(1);
      }
      
      const product = await monitor.addProduct(url, name, targetPrice);
      console.log('商品添加成功:', product);
      break;
      
    case 'start':
      monitor.start();
      console.log('监控服务已启动，按 Ctrl+C 停止');
      
      // 保持进程运行
      process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
      });
      break;
      
    case 'stop':
      monitor.stop();
      break;
      
    case 'list':
      const products = monitor.listProducts();
      console.table(products);
      break;
      
    case 'check':
      await monitor.checkAllProducts();
      break;
      
    case 'report':
      const report = monitor.generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'history':
      const productId = args[1];
      if (!productId) {
        console.error('请提供商品ID');
        process.exit(1);
      }
      const history = monitor.getPriceHistory(productId);
      console.table(history);
      break;
      
    case 'help':
    default:
      console.log(`
电商价格监控工具

命令:
  add <url> [name] [targetPrice]   添加监控商品
  start                            启动监控服务
  stop                             停止监控服务
  list                             列出所有商品
  check                            立即检查所有商品
  report                           生成监控报告
  history <productId>              查看商品价格历史
  help                             显示帮助信息

示例:
  node monitor.js add https://item.taobao.com/item.htm?id=123456789 "iPhone 15" 5000
  node monitor.js start
  node monitor.js list
      `);
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PriceMonitor;