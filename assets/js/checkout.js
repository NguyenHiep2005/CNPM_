// checkout.js - Xử lý thanh toán

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Checkout] Page loaded');
    loadCheckoutData();
    setupFormHandlers();
    setupShippingCalculation();
});

// Load cart items and populate form
async function loadCheckoutData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    console.log('[Checkout] Current user:', currentUser);
    
    if (!currentUser.id) {
        showAlert('Vui lòng đăng nhập để thanh toán', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Pre-fill user info
    try {
        const emailEl = document.getElementById('email');
        const firstNameEl = document.getElementById('firstName');
        const lastNameEl = document.getElementById('lastName');
        const phoneEl = document.getElementById('phone');
        const addressEl = document.getElementById('address');
        
        if (emailEl) emailEl.value = currentUser.email || '';
        if (firstNameEl) firstNameEl.value = currentUser.fullname?.split(' ')[0] || '';
        if (lastNameEl) lastNameEl.value = currentUser.fullname?.split(' ').slice(1).join(' ') || '';
        if (phoneEl) phoneEl.value = currentUser.phone || '';
        if (addressEl) addressEl.value = currentUser.address || '';
    } catch (error) {
        console.error('[Checkout] Error filling user info:', error);
    }

    // Load cart items
    try {
        const response = await fetch(`http://localhost:3000/cart?userId=${currentUser.id}`);
        let cartItems = await response.json();

        console.log('[Checkout] Cart items loaded:', cartItems);

        if (!cartItems || cartItems.length === 0) {
            document.getElementById('orderItemsContainer').innerHTML = `
                <div style="text-align: center; padding: 20px; color: #999;">
                    <p>Giỏ hàng trống. <a href="index.html">Quay lại mua hàng</a></p>
                </div>
            `;
            return;
        }

        // Lấy thông tin sản phẩm từ bảng products
        const productsResponse = await fetch('http://localhost:3000/products');
        const allProducts = await productsResponse.json();
        
        // Tạo map sản phẩm để tìm kiếm nhanh
        const productMap = {};
        allProducts.forEach(p => {
            productMap[p.id] = p;
        });

        // Merge cart items với product info
        cartItems = cartItems.map(item => {
            const product = productMap[item.productId];
            return {
                ...item,
                name: product?.name || 'Sản phẩm không xác định',
                price: product?.finalPrice || product?.price || 0,
                image: product?.image || './assets/img/mau1.jpg'
            };
        });

        console.log('[Checkout] Merged cart items:', cartItems);

        // Display items
        let subtotal = 0;
        const itemsHTML = cartItems.map((item, index) => {
            console.log(`[Checkout] Item ${index}:`, item);
            
            const itemImage = item.image || './assets/img/mau1.jpg';
            const itemName = item.name || 'Sản phẩm không xác định';
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemSize = item.size || item.selectedSize || 'N/A';
            const itemColor = item.color || item.selectedColor || 'N/A';
            
            const itemTotal = itemPrice * itemQuantity;
            subtotal += itemTotal;
            
            return `
                <div class="order-item" style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <div class="order-item-img" style="flex-shrink: 0;">
                        <img src="${itemImage}" alt="${itemName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">
                    </div>
                    <div class="order-item-info" style="flex: 1;">
                        <div class="order-item-name" style="font-weight: 600; color: #333; margin-bottom: 4px;">${itemName}</div>
                        <div class="order-item-details" style="font-size: 12px; color: #999; margin-bottom: 8px;">
                            Size: ${itemSize} | Màu: ${itemColor} | SL: ${itemQuantity}
                        </div>
                        <div class="order-item-price" style="font-weight: 600; color: black;">${itemTotal.toLocaleString()}₫</div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('orderItemsContainer').innerHTML = itemsHTML;
        document.getElementById('subtotal').textContent = subtotal.toLocaleString() + '₫';
        
        console.log('[Checkout] Subtotal:', subtotal);
        
        // Calculate total
        calculateTotal(subtotal);

    } catch (error) {
        console.error('[Checkout] Error loading cart:', error);
        showAlert('Lỗi tải giỏ hàng: ' + error.message, 'error');
    }
}

// Setup shipping calculation
function setupShippingCalculation() {
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    
    shippingOptions.forEach(option => {
        option.addEventListener('change', () => {
            const subtotalText = document.getElementById('subtotal').textContent;
            const subtotal = parseInt(subtotalText.replace(/[^0-9]/g, '')) || 0;
            calculateTotal(subtotal);
        });
    });
}

// Calculate total with shipping
function calculateTotal(subtotal) {
    const shippingEl = document.querySelector('input[name="shipping"]:checked');
    const shippingValue = shippingEl ? shippingEl.value : 'standard';
    let shippingFee = 0;

    if (shippingValue === 'express') {
        shippingFee = 29000;
    }

    const total = subtotal + shippingFee;

    document.getElementById('shippingFee').textContent = 
        shippingValue === 'express' ? '+29.000₫' : 'Miễn phí';
    document.getElementById('totalAmount').textContent = total.toLocaleString() + '₫';

    console.log('[Checkout] Total calculated:', { subtotal, shippingFee, total });

    // Store for order creation
    window.checkoutTotal = { subtotal, shippingFee, total };
}

// Setup form submission
function setupFormHandlers() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) {
        console.error('[Checkout] Form not found');
        return;
    }
    
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const district = document.getElementById('district').value.trim();
        const terms = document.getElementById('terms').checked;

        if (!firstName || !lastName || !email || !phone || !address || !city || !district) {
            showAlert('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        if (!terms) {
            showAlert('Vui lòng chấp nhận điều khoản', 'error');
            return;
        }

        // Create order
        await createOrder({
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            district,
            notes: document.getElementById('notes').value.trim(),
            shipping: document.querySelector('input[name="shipping"]:checked').value
        });
    });
}

// Create order
async function createOrder(formData) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || !currentUser.id) {
        showAlert('Vui lòng đăng nhập để tạo đơn hàng', 'error');
        return;
    }

    try {
        console.log('[Checkout] Creating order...');
        
        // Get cart items
        const cartResponse = await fetch(`http://localhost:3000/cart?userId=${currentUser.id}`);
        const cartItems = await cartResponse.json();

        if (!cartItems || cartItems.length === 0) {
            showAlert('Giỏ hàng trống', 'error');
            return;
        }

        console.log('[Checkout] Creating order with items:', cartItems);

        // Lấy thông tin sản phẩm để có tên, giá, hình ảnh
        const productsResponse = await fetch('http://localhost:3000/products');
        const allProducts = await productsResponse.json();
        
        const productMap = {};
        allProducts.forEach(p => {
            productMap[p.id] = p;
        });

        // Merge cart items với product info
        const itemsWithDetails = cartItems.map(item => {
            const product = productMap[item.productId];
            return {
                id: item.productId,
                name: product?.name || item.name || 'Sản phẩm',
                price: item.price || product?.finalPrice || product?.price || 0,
                image: item.image || product?.image || './assets/img/mau1.jpg',
                size: item.size || item.selectedSize || 'N/A',
                color: item.color || item.selectedColor || 'N/A',
                quantity: item.quantity || 1
            };
        });

        // Create order object
        const order = {
            userId: currentUser.id,
            orderDate: new Date().toISOString(),
            status: 'pending',
            shippingInfo: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                district: formData.district,
                city: formData.city,
                notes: formData.notes || ''
            },
            shippingMethod: formData.shipping === 'express' ? 'express' : 'standard',
            paymentMethod: 'cod',
            items: itemsWithDetails,
            totalAmount: window.checkoutTotal.total
        };

        console.log('[Checkout] Order object to save:', order);

        // Save order
        const orderResponse = await fetch(`http://localhost:3000/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });

        if (!orderResponse.ok) {
            throw new Error('Lỗi tạo đơn hàng');
        }

        const savedOrder = await orderResponse.json();
        console.log('[Checkout] Order created:', savedOrder);

        // Clear cart
        try {
            for (const item of cartItems) {
                await fetch(`http://localhost:3000/cart/${item.id}`, {
                    method: 'DELETE'
                });
            }
        } catch (error) {
            console.error('[Checkout] Error clearing cart:', error);
        }
        // Trong hàm createOrder, trước khi redirect:
        localStorage.setItem('checkoutTotal', window.checkoutTotal.total);

        // Redirect to success page
        window.location.href = 'order-succes.html';
        // Redirect to success page
        showAlert('✓ Đặt hàng thành công!', 'success');
        setTimeout(() => {
            window.location.href = 'order-succes.html';
        }, 1500);

    } catch (error) {
        console.error('[Checkout] Error creating order:', error);
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Show alert message
function showAlert(message, type) {
    const alertEl = document.getElementById('alertMessage');
    if (!alertEl) {
        console.error('[Checkout] Alert element not found');
        alert(message);
        return;
    }
    alertEl.textContent = message;
    alertEl.className = `alert ${type}`;
    console.log(`[Checkout] Alert [${type}]:`, message);
}