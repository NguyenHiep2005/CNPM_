let currentUser = null;
let allOrdersCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Profile] DOMContentLoaded');
    loadUserInfo();
    await loadOrders();
});

function loadUserInfo() {
    try {
        const userData = localStorage.getItem('currentUser');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        console.log('[Profile] userData:', userData);
        console.log('[Profile] isLoggedIn:', isLoggedIn);
        
        if (!userData || !isLoggedIn) {
            console.log('[Profile] Not logged in');
            document.getElementById('userName').textContent = 'Người dùng';
            return;
        }
        
        currentUser = JSON.parse(userData);
        console.log('[Profile] Loaded currentUser:', currentUser);
        
        const nameEl = document.getElementById('userName');
        const emailEl = document.getElementById('userEmail');
        const phoneEl = document.getElementById('userPhone');
        const addressEl = document.getElementById('userAddress');
        
        if (nameEl) nameEl.textContent = currentUser.fullname || 'Người dùng';
        if (emailEl) emailEl.textContent = currentUser.email || 'N/A';
        if (phoneEl) phoneEl.textContent = currentUser.phone || 'N/A';
        if (addressEl) addressEl.textContent = currentUser.address || 'N/A';
        
    } catch (error) {
        console.error('[Profile] Error in loadUserInfo:', error);
    }
}

// = định dạng ngày và giờ
function formatOrderDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    
    try {
        const date = new Date(dateStr);
        
        // Định dạng: "12/01/2025 14:30"
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        return date.toLocaleString('vi-VN', options);
    } catch (error) {
        console.error('[Profile] Error formatting date:', error);
        return 'N/A';
    }
}

// = tính thời gian đã trôi qua từ ngày đặt hàng đến hiện tại
function getTimeAgo(dateStr) {
    if (!dateStr) return '';
    
    try {
        const orderDate = new Date(dateStr);
        const now = new Date();
        const diffMs = now - orderDate;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) return 'Vừa mới';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        
        return `${Math.floor(diffDays / 30)} tháng trước`;
    } catch (error) {
        return '';
    }
}

async function loadOrders() {
    console.log('[Profile] loadOrders called, currentUser:', currentUser);
    
    const container = document.getElementById('ordersContainer');
    if (!container) {
        console.error('[Profile] ordersContainer not found');
        return;
    }
    
    try {
        
        console.log('[Profile] Fetching products...');
        const productsResponse = await fetch('http://localhost:3000/products');
        let allProducts = await productsResponse.json();
        const productMap = {};
        allProducts.forEach(p => {
            productMap[p.id] = p;
        });
        console.log('[Profile] Products map created with', Object.keys(productMap).length, 'products');
        
        
        console.log('[Profile] Fetching all orders...');
        const ordersResponse = await fetch('http://localhost:3000/orders');
        
        if (!ordersResponse.ok) {
            throw new Error(`HTTP ${ordersResponse.status}`);
        }
        
        let allOrders = await ordersResponse.json();
        console.log('[Profile] Total orders from API:', allOrders.length);
        console.log('[Profile] All orders:', allOrders);
        
       
        allOrders.forEach((order, idx) => {
            console.log(`[Profile] Order ${idx}: id=${order.id}, userId=${order.userId}, status=${order.status}`);
        });
        
        
        allOrders = allOrders.map(order => {
            if (order.items && order.items.length > 0) {
                order.items = order.items.map(item => {
                    if (!item.name || !item.image) {
                        const product = productMap[item.productId || item.id];
                        if (product) {
                            item.name = item.name || product.name;
                            item.image = item.image || product.image;
                            item.price = item.price || product.finalPrice || product.price;
                        }
                    }
                    return item;
                });
            }
            return order;
        });
        
        allOrdersCache = allOrders;
        console.log('[Profile] Orders enriched with product info');
        
        
        let userOrders = [];
        
        if (currentUser && currentUser.id) {
            console.log('[Profile] Filtering orders for userId:', currentUser.id, 'type:', typeof currentUser.id);
            userOrders = allOrders.filter(order => {
                const orderUserId = String(order.userId).trim();
                const currentUserId = String(currentUser.id).trim();
                const matches = orderUserId === currentUserId;
                
                if (!matches) {
                    console.log(`[Profile]  Order ${order.id}: '${orderUserId}' !== '${currentUserId}'`);
                } else {
                    console.log(`[Profile]  Order ${order.id}: '${orderUserId}' === '${currentUserId}'`);
                }
                
                return matches;
            });
            
            console.log('[Profile] Filtered', userOrders.length, 'orders for current user');
        } else {
            console.log('[Profile] No currentUser, showing all orders');
            userOrders = allOrders;
        }
        
        displayOrders(userOrders);
        
    } catch (error) {
        console.error('[Profile] Error loading orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-exclamation-circle"></i>
                <p>Lỗi tải đơn hàng: ${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 15px;">Làm mới trang</button>
            </div>
        `;
    }
}

function displayOrders(orders) {
    console.log('[Profile] displayOrders called with', orders.length, 'orders');
    
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>Bạn chưa có đơn hàng nào</p>
                <a href="index.html" class="btn btn-primary" style="margin-top: 15px; display: inline-block;">
                    Tiếp tục mua sắm
                </a>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    orders.forEach(order => {
        const dateStr = order.orderDate || order.createdAt;
        const orderDate = formatOrderDateTime(dateStr);
        const timeAgo = getTimeAgo(dateStr);
        const itemCount = (order.items && order.items.length) ? order.items.length : 0;
        const statusText = getStatusText(order.status);
        const statusClass = order.status || 'pending';
        const total = order.totalAmount || order.total || 0;
        
        // Hiển thị thời gian chi tiết
        const timeDisplay = timeAgo ? `${orderDate} (${timeAgo})` : orderDate;
        
        html += `
            <div class="order-item">
                <div class="order-header">
                    <div>
                        <div class="order-id">Đơn hàng #${order.id}</div>
                        <div class="order-date" title="${orderDate}">
                            <i class="fa-solid fa-calendar"></i> ${orderDate}
                            <span style="color: #999; font-size: 12px; margin-left: 8px;">${timeAgo}</span>
                        </div>
                    </div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="order-summary">
                    <div>
                        <span class="order-items-count">${itemCount} sản phẩm</span>
                    </div>
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div class="order-amount">${total.toLocaleString()}₫</div>
                        <button class="btn btn-primary" onclick="viewOrderDetail('${order.id}')">
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('[Profile] Orders displayed successfully');
}

function getStatusText(status) {
    const map = {
        'pending': '⏳ Chờ xử lý',
        'shipping': '🚚 Đang giao',
        'delivered': '✓ Đã giao',
        'processing': 'Đang xử lý',
        
    };
    // Default to "Chờ xử lý" nếu không có status hoặc trạng thái không rõ
    return map[status] || (status ? map[status] : '⏳ Chờ xử lý');
}

function viewOrderDetail(orderId) {
    console.log('[Profile] viewOrderDetail:', orderId);
    const order = allOrdersCache.find(o => String(o.id) === String(orderId));
    
    if (order) {
        showOrderModal(order);
    } else {
        alert('Không tìm thấy đơn hàng');
    }
}

function showOrderModal(order) {
    console.log('[Profile] showOrderModal:', order);
    
    const dateStr = order.orderDate || order.createdAt;
    const orderDate = formatOrderDateTime(dateStr);
    const timeAgo = getTimeAgo(dateStr);
    const statusText = getStatusText(order.status);
    const statusClass = order.status || 'pending';
    const total = order.totalAmount || order.total || 0;
    
    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const itemName = item.name || 'Sản phẩm';
            const itemPrice = item.price || 0;
            const itemQty = item.quantity || 1;
            const itemSize = item.size || item.selectedSize || 'N/A';
            const itemColor = item.color || item.selectedColor || 'N/A';
            const itemImage = item.image || './assets/img/mau1.jpg';
            
            itemsHtml += `
                <div style="display: flex; gap: 15px; padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                    <div style="flex-shrink: 0;">
                        <img src="${itemImage}" alt="${itemName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                    </div>
                    <div style="flex: 1;">
                        <div class="item-name">${itemName}</div>
                        <div class="item-details">Size: ${itemSize} | Màu: ${itemColor} | SL: ${itemQty}</div>
                        <div class="item-price">${(itemPrice * itemQty).toLocaleString()}₫</div>
                    </div>
                </div>
            `;
        });
    }
    
    let shippingHtml = '';
    if (order.shippingInfo) {
        const info = order.shippingInfo;
        shippingHtml = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                <h4 style="margin-bottom: 15px; color: #333;">Thông tin giao hàng</h4>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.8;">
                    <div><strong>${(info.firstName || '') + ' ' + (info.lastName || '')}</strong></div>
                    <div>${info.phone || ''}</div>
                    <div>${info.address || ''}, ${info.district || ''}, ${info.city || ''}</div>
                </div>
            </div>
        `;
    }
    
    //Hiển thị thời gian chi tiết trong modal
    const html = `
        <div class="modal-header">
            <h2>Chi tiết đơn hàng #${order.id}</h2>
            <p style="color: #999; font-size: 13px; margin: 0;">
                <i class="fa-solid fa-calendar-days"></i> Đặt hàng: ${orderDate} 
                <span style="color: #bbb;">•</span> 
                <span style="color: #999;">${timeAgo}</span>
            </p>
        </div>
        
        <div class="order-info-grid">
            <div class="info-block">
                <div class="info-label">Trạng thái</div>
                <div class="order-status ${statusClass}" style="display: inline-block; margin-top: 6px;">${statusText}</div>
            </div>
            <div class="info-block">
                <div class="info-label">Tổng tiền</div>
                <div class="info-value" style="color: red;">${total.toLocaleString()}₫</div>
            </div>
        </div>
        
        <div class="order-items-list">
            <h4>Sản phẩm (${order.items?.length || 0})</h4>
            ${itemsHtml || '<p style="color: #999;">Không có sản phẩm</p>'}
        </div>
        
        ${shippingHtml}
    `;
    
    document.getElementById('orderDetailContent').innerHTML = html;
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('orderModal');
    if (e.target === modal) {
        closeOrderModal();
    }
});