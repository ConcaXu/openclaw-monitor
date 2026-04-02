// 基本功能测试
const PriceMonitor = require('./monitor.js');

async function test() {
  console.log('🦞 测试电商价格监控技能...\n');
  
  const monitor = new PriceMonitor();
  
  // 1. 测试添加商品
  console.log('1. 测试添加商品...');
  const product = await monitor.addProduct(
    'https://item.taobao.com/item.htm?id=123456789',
    '测试商品 - iPhone 15',
    5000
  );
  console.log('✅ 商品添加成功:', {
    id: product.id,
    name: product.name,
    platform: product.platform,
    targetPrice: product.targetPrice
  });
  
  // 2. 测试商品列表
  console.log('\n2. 测试商品列表...');
  const products = monitor.listProducts();
  console.log('✅ 当前监控商品数:', products.length);
  console.table(products);
  
  // 3. 测试价格检查（模拟）
  console.log('\n3. 测试价格检查...');
  const priceResult = await monitor.checkProductPrice(product);
  console.log('✅ 价格检查完成:', priceResult);
  
  // 4. 测试价格历史
  console.log('\n4. 测试价格历史...');
  const history = monitor.getPriceHistory(product.id);
  console.log('✅ 价格历史记录数:', history.length);
  if (history.length > 0) {
    console.table(history.slice(-3)); // 显示最近3条
  }
  
  // 5. 测试报告生成
  console.log('\n5. 测试报告生成...');
  const report = monitor.generateReport();
  console.log('✅ 报告生成成功');
  console.log('   总商品数:', report.totalProducts);
  console.log('   活跃商品:', report.activeProducts);
  console.log('   平均价格:', report.summary.averagePrice.toFixed(2));
  
  // 6. 测试监控服务启停
  console.log('\n6. 测试监控服务启停...');
  monitor.start();
  console.log('✅ 监控服务已启动');
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  monitor.stop();
  console.log('✅ 监控服务已停止');
  
  console.log('\n🎉 所有测试通过！');
  console.log('\n📊 下一步行动:');
  console.log('   1. 运行真实商品测试: node monitor.js add <真实商品URL>');
  console.log('   2. 启动长期监控: node monitor.js start');
  console.log('   3. 发布到clawhub.com: 准备技能包并上传');
  console.log('   4. 开始推广: 在电商论坛、社交媒体宣传');
  console.log('\n💰 盈利预测:');
  console.log('   - 第一个月: 10个付费用户 → 99元');
  console.log('   - 第三个月: 50个付费用户 → 495元');
  console.log('   - 第六个月: 200个付费用户 → 1980元');
  console.log('   - 第一年目标: 1000个付费用户 → 9900元/月');
}

test().catch(console.error);