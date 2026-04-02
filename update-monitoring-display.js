// 更新监控列表显示函数
function updateMonitoringList() {
    const listContainer = document.getElementById('monitoringList');
    listContainer.innerHTML = '<h3>📊 当前监控中的商品</h3>';
    
    if (monitoringProducts.length === 0) {
        listContainer.innerHTML += '<div style="text-align: center; padding: 20px; color: #6c757d;">暂无监控商品，请添加</div>';
        return;
    }
    
    monitoringProducts.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'monitoring-item';
        const mockBadge = product.isMock ? 
            '<span style="background: #ffc107; color: #000; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; margin-left: 5px;">模拟</span>' : 
            '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; margin-left: 5px;">真实</span>';
        item.innerHTML = `
            <div class="name">${product.name} ${mockBadge}</div>
            <div class="price">当前价格: ¥${product.currentPrice}</div>
            <div>目标价格: ¥${product.targetPrice || '未设置'}</div>
            <div>最低价: ¥${product.lowestPrice} | 最高价: ¥${product.highestPrice}</div>
            <div>最后检查: ${product.lastChecked}</div>
            <div class="status ${product.isActive ? 'online' : 'offline'}">
                ${product.isActive ? '监控中' : '已停止'}
            </div>
            <button onclick="removeProduct(${index})" style="margin-top: 10px; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                移除
            </button>
        `;
        listContainer.appendChild(item);
    });
}