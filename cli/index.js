#!/usr/bin/env node

/**
 * 电商价格监控CLI工具
 */

const path = require('path');
const fs = require('fs');

// 检查是否在技能目录中
const skillDir = path.join(__dirname, '..');
const monitorPath = path.join(skillDir, 'monitor.js');

if (!fs.existsSync(monitorPath)) {
  console.error('错误: 找不到监控主程序');
  process.exit(1);
}

// 传递参数给主程序
const args = process.argv.slice(2);
const childProcess = require('child_process');

// 设置环境变量
const env = {
  ...process.env,
  NODE_PATH: path.join(skillDir, 'node_modules') + ':' + (process.env.NODE_PATH || '')
};

// 执行主程序
const proc = childProcess.spawn('node', [monitorPath, ...args], {
  stdio: 'inherit',
  env: env,
  cwd: skillDir
});

proc.on('close', (code) => {
  process.exit(code);
});

proc.on('error', (err) => {
  console.error('启动监控程序失败:', err);
  process.exit(1);
});