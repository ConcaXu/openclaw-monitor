#!/bin/bash

# 电商价格监控技能安装脚本

set -e

echo "🦞 安装电商价格监控技能..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装Node.js (版本 >= 18)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本需要 >= 18，当前版本: $(node -v)"
    exit 1
fi

# 检查是否在OpenClaw技能目录
SKILLS_DIR="$HOME/.openclaw/workspace/skills"
if [ ! -d "$SKILLS_DIR" ]; then
    echo "❌ 找不到OpenClaw技能目录: $SKILLS_DIR"
    echo "请确保OpenClaw已正确安装"
    exit 1
fi

# 创建技能目录
SKILL_DIR="$SKILLS_DIR/ecommerce-price-monitor"
mkdir -p "$SKILL_DIR"

# 复制文件
echo "📁 复制文件..."
cp -r ./* "$SKILL_DIR/"

# 安装依赖
echo "📦 安装Node.js依赖..."
cd "$SKILL_DIR"
npm install --production

# 创建符号链接到全局bin目录
if [ -d "$HOME/.local/bin" ]; then
    BIN_DIR="$HOME/.local/bin"
elif [ -d "/usr/local/bin" ]; then
    BIN_DIR="/usr/local/bin"
else
    BIN_DIR="$HOME/bin"
    mkdir -p "$BIN_DIR"
fi

# 使CLI可执行
chmod +x "$SKILL_DIR/cli/index.js"
chmod +x "$SKILL_DIR/monitor.js"

# 创建符号链接
ln -sf "$SKILL_DIR/cli/index.js" "$BIN_DIR/ecommerce-price-monitor"

echo "✅ 安装完成！"
echo ""
echo "使用方法:"
echo "1. 添加商品: ecommerce-price-monitor add <商品URL> [商品名称] [目标价格]"
echo "2. 启动监控: ecommerce-price-monitor start"
echo "3. 查看列表: ecommerce-price-monitor list"
echo "4. 生成报告: ecommerce-price-monitor report"
echo ""
echo "示例:"
echo "  ecommerce-price-monitor add https://item.taobao.com/item.htm?id=123456789 \"iPhone 15\" 5000"
echo "  ecommerce-price-monitor start"
echo ""
echo "📊 盈利模式:"
echo "  - 免费版: 监控3个商品"
echo "  - 高级版(9.9元/月): 无限监控+实时提醒"
echo "  - 企业版(99元/月): API访问+团队协作"
echo ""
echo "开始监控价格，抓住每一个优惠机会！ 🦞💰"