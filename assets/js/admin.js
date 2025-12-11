const API_URL = 'http://localhost:3000';
let currentUser = null;
let currentEditingProduct = null;
let currentSection = 'dashboard';
let isSubmittingProduct = false;
// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Admin] Dashboard loading');
    
    // Check admin access
    let userData = localStorage.getItem('currentUser');
    let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Nếu chưa đăng nhập, tự động set admin user (cho development)
    if (!userData || !isLoggedIn) {
        try {
            // Fetch admin user từ API
            const response = await fetch(`${API_URL}/users?username=admin`);
            const users = await response.json();
            
            if (users.length > 0) {
                const adminUser = users[0];
                currentUser = {
                    id: adminUser.id,
                    username: adminUser.username,
                    email: adminUser.email,
                    fullname: adminUser.fullname,
                    phone: adminUser.phone,
                    address: adminUser.address
                };
                
                // Lưu vào localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('isLoggedIn', 'true');
                
                console.log('[Admin] Admin user loaded from API');
            } else {
                throw new Error('Admin user not found');
            }
        } catch (error) {
            console.error('[Admin] Error:', error);
            // Fallback: chuyển hướng tới login
            alert('Cần đăng nhập trước. Vui lòng đăng nhập với tài khoản admin.');
            window.location.href = 'login.html';
            return;
        }
    } else {
        currentUser = JSON.parse(userData);
    }
    
    // Check if admin
    if (currentUser.username !== 'admin') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'index.html';
        return;
    }
    
    // Display admin info
    document.getElementById('adminUsername').textContent = `Admin: ${currentUser.fullname}`;
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Load initial data
    loadDashboardData();
    
    // Setup menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(item.dataset.section);
        });
    });
    
    // Setup product form
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
});

// ============ UPDATE TIME ============
function updateTime() {
    const now = new Date();
    const time = now.toLocaleString('vi-VN');
    document.getElementById('currentTime').textContent = time;
}

// ============ SWITCH SECTION ============
// ============ SWITCH SECTION ============
function switchSection(sectionName) {
    console.log('[Admin] Switching to:', sectionName);
    
    currentSection = sectionName; // ✅ Lưu section hiện tại
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    // Show selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
    }
    
    // Update menu
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Quản lý sản phẩm',
        'users': 'Quản lý tài khoản',
        'orders': 'Quản lý đơn hàng',
        'statistics': 'Thống kê'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    // Load data for section
    if (sectionName === 'products') {
        loadProducts();
    } else if (sectionName === 'users') {
        loadUsers();
    } else if (sectionName === 'orders') {
        loadOrders();
    } else if (sectionName === 'statistics') {
        updateStatistics();
    }
}

// ============ SHOW ALERT ============
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert show ${type}`;
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 3000);
}

// ============ LOAD DASHBOARD DATA ============
async function loadDashboardData() {
    try {
        const [productsRes, usersRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/orders`)
        ]);
        
        const products = await productsRes.json();
        const users = await usersRes.json();
        const orders = await ordersRes.json();
        
        // Update dashboard stats
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalUsers').textContent = users.length;
        
       
                // Calculate today's orders and revenue (only delivered orders count)
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => {
            const orderDate = new Date(o.orderDate);
            return orderDate.toDateString() === today && (o.status === 'delivered' || o.status === undefined && o.completedAt);
        });

        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        document.getElementById('todayOrders').textContent = todayOrders.length;
        document.getElementById('todayRevenue').textContent = todayRevenue.toLocaleString() + '₫';
        
        console.log('[Admin] Dashboard data loaded successfully');
    } catch (error) {
        console.error('[Admin] Error loading dashboard:', error);
        showAlert('Lỗi tải dữ liệu dashboard', 'error');
    }
}

// ============ PRODUCTS MANAGEMENT ============
async function loadProducts() {
    try {
        console.log('[Admin] Loading products...');
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${(product.finalPrice || product.price).toLocaleString()}₫</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn btn-primary btn-edit" data-id="${product.id}">Sửa</button>
                    <button class="btn btn-danger btn-delete" data-id="${product.id}">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // ✅ Gắn event listeners SAU khi render HTML
        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });
        
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
        
        console.log('[Admin] Products loaded:', products.length);
    } catch (error) {
        console.error('[Admin] Error loading products:', error);
        showAlert('Lỗi tải sản phẩm', 'error');
    }
}

// ============ PRODUCT MANAGEMENT ============
function openProductModal() {
    console.log('[Admin] Opening product modal for add');
    
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    currentEditingProduct = null;
    title.textContent = 'Thêm sản phẩm mới';
    modal.classList.add('active');
}

async function editProduct(productId) {
    console.log('[Admin] Editing product:', productId);
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const product = await response.json();
        
        currentEditingProduct = productId;
        
        // Điền dữ liệu vào form
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productFinalPrice').value = product.finalPrice || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productImage').value = product.image || '';
        document.getElementById('productDesc').value = product.description || '';
        document.getElementById('productBrand').value = product.brand || 'NIKE';
        
        // Cập nhật tiêu đề
        document.getElementById('modalTitle').textContent = 'Sửa sản phẩm: ' + product.name;
        
        // Mở modal
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.add('active');
            console.log('[Admin] Modal opened for editing');
        } else {
            console.error('[Admin] Modal not found!');
        }
    } catch (error) {
        console.error('[Admin] Error loading product:', error);
        showAlert('❌ Lỗi tải sản phẩm: ' + error.message, 'error');
    }
}

function closeProductModal() {
    console.log('[Admin] Closing product modal');
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentEditingProduct = null;
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    // ✅ LOCK - Ngăn double submit
    if (isSubmittingProduct) {
        console.warn('[Admin] Already submitting, ignoring duplicate request');
        return;
    }
    
    isSubmittingProduct = true;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';
    
    const price = parseInt(document.getElementById('productPrice').value);
    const finalPrice = parseInt(document.getElementById('productFinalPrice').value);
    const discount = Math.round(((price - finalPrice) / price) * 100);
    const productName = document.getElementById('productName').value.trim();
    
    const productData = {
        name: productName,
        price: price,
        finalPrice: finalPrice,
        stock: parseInt(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDesc').value,
        brand: document.getElementById('productBrand').value || 'NIKE',
        rating: 4.5,
        reviews: 0,
        color: ['White', 'Black', 'Red'],
        size: [36, 37, 38, 39, 40, 41, 42, 43],
        discount: discount
    };
    
    try {
        // ✅ KIỂM TRA TRÙNG LẶP - CHỈ khi thêm mới (không sửa)
        if (!currentEditingProduct) {
            console.log('[Admin] Checking for duplicate products...');
            const productsRes = await fetch(`${API_URL}/products`);
            const products = await productsRes.json();
            
            const duplicateProduct = products.find(p => 
                p.name && p.name.toLowerCase().trim() === productName.toLowerCase().trim()
            );
            
            if (duplicateProduct) {
                console.warn('[Admin] Duplicate found:', duplicateProduct.name);
                showAlert(`❌ Sản phẩm "${productName}" đã tồn tại!`, 'error');
                isSubmittingProduct = false;
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
        }
        
        let response;
        
        if (currentEditingProduct) {
            // ✅ CẬP NHẬT
            console.log('[Admin] Updating product:', currentEditingProduct);
            response = await fetch(`${API_URL}/products/${currentEditingProduct}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // ✅ THÊM MỚI
            console.log('[Admin] Creating new product');
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            const result = await response.json();
            console.log('[Admin] Product saved:', result);
            showAlert(currentEditingProduct ? '✓ Cập nhật sản phẩm thành công' : '✓ Thêm sản phẩm thành công', 'success');
            closeProductModal();
            loadProducts();
        } else {
            showAlert('❌ Lỗi: ' + response.statusText, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
        
    } catch (error) {
        console.error('[Admin] Error:', error);
        showAlert('❌ Lỗi: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    } finally {
        isSubmittingProduct = false;
    }
}

async function deleteProduct(productId) {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
        return;
    }
    
    try {
        console.log('[Admin] Deleting product:', productId);
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('✓ Xóa sản phẩm thành công', 'success');
            loadProducts();
            console.log('[Admin] Product deleted successfully');
        } else {
            showAlert('❌ Lỗi xóa: ' + response.statusText, 'error');
        }
        
    } catch (error) {
        console.error('[Admin] Error:', error);
        showAlert('❌ Lỗi xóa sản phẩm: ' + error.message, 'error');
    }
}

// ============ USERS MANAGEMENT ============
async function loadUsers() {
    try {
        console.log('[Admin] Loading users...');
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.fullname || 'N/A'}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('[Admin] Users loaded:', users.length);
    } catch (error) {
        console.error('[Admin] Error loading users:', error);
        showAlert('Lỗi tải người dùng', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Bạn chắc chắn muốn xóa tài khoản này?')) {
        return;
    }
    
    try {
        console.log('[Admin] Deleting user:', userId);
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('✓ Xóa tài khoản thành công', 'success');
            loadUsers(); // ✅ Chỉ reload users, không đổi tab
            // loadDashboardData(); // Bỏ dòng này hoặc gọi bên dưới
        }
        
    } catch (error) {
        console.error('[Admin] Error:', error);
        showAlert('❌ Lỗi xóa tài khoản', 'error');
    }
}
// ============ ORDERS MANAGEMENT ============
async function loadOrders() {
    try {
        console.log('[Admin] Loading orders...');
        const [ordersRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/orders`),
            fetch(`${API_URL}/users`)
        ]);
        
        const orders = await ordersRes.json();
        const users = await usersRes.json();
        
        // Get filter value
        const filterValue = document.querySelector('input[name="orderFilter"]:checked').value;
        
        // Filter orders based on status
        let filteredOrders = orders;
        if (filterValue !== 'all') {
            filteredOrders = orders.filter(o => (o.status || 'pending') === filterValue);
        }
        
        // Sort by date descending
        filteredOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        
        filteredOrders.forEach(order => {
            const user = users.find(u => u.id == order.userId);
            const statusBadges = {
                'pending': '<span style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px;">⏳ Chờ xử lý</span>',
                'shipping': '<span style="background: #cfe2ff; color: #084298; padding: 4px 8px; border-radius: 4px; font-size: 12px;">🚚 Đang giao</span>',
                'delivered': '<span style="background: #d1e7dd; color: #0f5132; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✓ Đã giao</span>'
            };
            
            const status = order.status || 'pending';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${user?.fullname || 'Không xác định'}</td>
                <td>${new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                <td>${order.totalAmount?.toLocaleString()}₫</td>
                <td>${statusBadges[status]}</td>
                <td>
                    <button class="btn btn-primary" onclick="viewOrderDetail(${order.id})">Xem</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('[Admin] Orders loaded:', filteredOrders.length);
    } catch (error) {
        console.error('[Admin] Error loading orders:', error);
        showAlert('Lỗi tải đơn hàng', 'error');
    }
}

async function viewOrderDetail(orderId) {
    try {
        console.log('[Admin] Viewing order:', orderId);
        const [orderRes, usersRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/orders/${orderId}`),
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/products`)
        ]);
        
        const order = await orderRes.json();
        const users = await usersRes.json();
        const products = await productsRes.json();
        
        const user = users.find(u => u.id == order.userId);
        
        // Build items HTML
        let itemsHtml = '';
        if (Array.isArray(order.items)) {
            itemsHtml = order.items.map(item => {
                const product = products.find(p => p.id == item.productId);
                return `
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                        <div>
                            <strong>${item.name}</strong><br/>
                            <small>Size: ${item.size}, Màu: ${item.color}</small><br/>
                            <small>SL: ${item.quantity}</small>
                        </div>
                        <div style="text-align: right;">
                            <strong>${(item.price * item.quantity).toLocaleString()}₫</strong>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const status = order.status || 'pending';
        const statusDisplay = {
            'pending': '⏳ Chờ xử lý',
            'shipping': '🚚 Đang giao',
            'delivered': '✓ Đã giao'
        };
        
        // Show modal with order details
        const detailsHtml = `
            <div style="margin-bottom: 20px;">
                <h3>Thông tin khách hàng</h3>
                <p><strong>Tên:</strong> ${user?.fullname || 'N/A'}</p>
                <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                <p><strong>Điện thoại:</strong> ${user?.phone || 'N/A'}</p>
                <p><strong>Địa chỉ:</strong> ${order.shippingInfo?.address || user?.address || 'N/A'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Thông tin đơn hàng</h3>
                <p><strong>ID Đơn:</strong> ${order.id}</p>
                <p><strong>Ngày đặt:</strong> ${new Date(order.orderDate).toLocaleString('vi-VN')}</p>
                <p><strong>Trạng thái:</strong> ${statusDisplay[status]}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Sản phẩm đặt</h3>
                ${itemsHtml}
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 6px;">
                <h3>Tổng cộng: ${order.totalAmount?.toLocaleString()}₫</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Cập nhật trạng thái</h3>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'pending')" style="flex: 1;">Chờ xử lý</button>
                    <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'shipping')" style="flex: 1; background: #17a2b8;">Đang giao</button>
                    <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'delivered')" style="flex: 1; background: #28a745;">Đã giao</button>
                </div>
            </div>
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                <div class="modal-header">Chi tiết đơn hàng #${order.id}</div>
                ${detailsHtml}
            </div>
        `;
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('[Admin] Error:', error);
        showAlert('Lỗi tải chi tiết đơn hàng', 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        console.log('[Admin] Updating order status:', orderId, newStatus);
        
        // Fetch current order to get all data
        const orderRes = await fetch(`${API_URL}/orders/${orderId}`);
        const order = await orderRes.json();
        
        // Update status
        order.status = newStatus;
        
        // Mark order as completed if delivered
        if (newStatus === 'delivered') {
            order.completedAt = new Date().toISOString();
        }
        
        // Update order in API
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            showAlert(`✓ Cập nhật trạng thái thành công: ${
                newStatus === 'pending' ? 'Chờ xử lý' :
                newStatus === 'shipping' ? 'Đang giao' :
                'Đã giao'
            }`, 'success');
            
            // Close modal
            document.querySelectorAll('.modal').forEach(m => m.remove());
            
            // Reload orders, không đổi tab
            loadOrders(); // Chỉ reload orders, không đổi tab
            // loadDashboardData(); // Bỏ dòng này hoặc gọi bên dưới
        }
        
    } catch (error) {
        console.error('[Admin] Error:', error);
        showAlert('Lỗi cập nhật trạng thái', 'error');
    }
}

// ============ STATISTICS ============
async function updateStatistics() {
    try {
        const statType = document.querySelector('input[name="statType"]:checked').value;
        console.log('[Admin] Loading statistics:', statType);
        
        const ordersRes = await fetch(`${API_URL}/orders`);
        const orders = await ordersRes.json();
        
        let statistics = {};
        
        if (statType === 'daily') {
            // Statistics by day (last 30 days)
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('vi-VN');
                
                const dayOrders = orders.filter(o => {
                    const orderDate = new Date(o.orderDate);
                    return orderDate.toLocaleDateString('vi-VN') === dateStr && o.status === 'delivered';
                });
                
                const revenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                const quantity = dayOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
                
                statistics[dateStr] = { revenue, quantity, orders: dayOrders.length };
            }
        } else {
            // Statistics by month (last 12 months)
            for (let i = 11; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStr = `${date.getMonth() + 1}/${date.getFullYear()}`;
                
                const monthOrders = orders.filter(o => {
                    const orderDate = new Date(o.orderDate);
                    return orderDate.getMonth() === date.getMonth() && 
                        orderDate.getFullYear() === date.getFullYear() && 
                        o.status === 'delivered';
                });
                
                const revenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                const quantity = monthOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
                
                statistics[monthStr] = { revenue, quantity, orders: monthOrders.length };
            }
        }
        
        // Display statistics
        let html = `
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>${statType === 'daily' ? 'Ngày' : 'Tháng'}</th>
                        <th>Doanh thu</th>
                        <th>Số sản phẩm bán</th>
                        <th>Số đơn hàng</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        Object.entries(statistics).forEach(([period, data]) => {
            html += `
                <tr>
                    <td>${period}</td>
                    <td>${data.revenue.toLocaleString()}₫</td>
                    <td>${data.quantity}</td>
                    <td>${data.orders}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        
        document.getElementById('statisticsContent').innerHTML = html;
        console.log('[Admin] Statistics loaded');
        
    } catch (error) {
        console.error('[Admin] Error loading statistics:', error);
        showAlert('Lỗi tải thống kê', 'error');
    }
}
// ============ RELOAD DASHBOARD (GIỮ TAB HIỆN TẠI) ============
async function reloadCurrentSection() {
    console.log('[Admin] Reloading current section:', currentSection);
    
    // Cập nhật dữ liệu dashboard tổng quát
    await loadDashboardData();
    
    // Reload dữ liệu của section hiện tại
    if (currentSection === 'products') {
        loadProducts();
    } else if (currentSection === 'users') {
        loadUsers();
    } else if (currentSection === 'orders') {
        loadOrders();
    } else if (currentSection === 'statistics') {
        updateStatistics();
    }
}

// ============ LOGOUT ============
function logout() {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    }
}