// search-cart.js

// DOM elements will be defined after document loads
let searchToggle, searchBox, searchInput, searchResults;
let cartBtn, cartBadge;

let cartDrawer = null;

function debounce(fn, wait=300) {
    let t;
    return function(...args){
        clearTimeout(t);
        t = setTimeout(()=>fn.apply(this,args), wait);
    };
}

function initDOMElements() {
    searchToggle = document.getElementById('searchToggle');
    searchBox = document.getElementById('searchBox');
    searchInput = document.getElementById('searchInput');
    searchResults = document.getElementById('searchResults');
    cartBtn = document.getElementById('cartBtn');
    cartBadge = document.getElementById('cartBadge');
    

    if (!searchToggle || !searchBox) {
        console.warn('[Search-Cart] Required elements not found');
        return false;
    }
    return true;
}

async function searchProducts(q) {
    if (!q || q.trim().length === 0) {
        searchResults.innerHTML = '';
        return;
    }

    const url = `http://localhost:3000/products?q=${encodeURIComponent(q.trim())}&_limit=12`;
    try {
        const res = await fetch(url);
        if (!res.ok) return;
        const items = await res.json();
        renderSearchResults(items);
    } catch (e) {
        console.error('Search error', e);
    }
}

function renderSearchResults(items) {
    searchResults.innerHTML = '';
    if (!items || items.length === 0) {
        searchResults.innerHTML = '<div style="padding:10px;color:#666">Không tìm thấy sản phẩm</div>';
        return;
    }

    items.forEach(p => {
        const a = document.createElement('a');
        a.href = `products.html?id=${encodeURIComponent(p.id)}`;
        a.className = 'search-result-item';
        a.innerHTML = `
            <img src="${p.image || './assets/img/img2.png'}" alt="${escapeHtml(p.name||'')}" />
            <div class="meta">
                <div class="name">${escapeHtml(p.name || '')}</div>
                <div class="price">${formatPrice(p.finalPrice ?? p.price ?? 0)}</div>
            </div>
        `;
        searchResults.appendChild(a);
    });
}

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }

function formatPrice(price) {
    if (typeof price !== 'number') {
        if (typeof price === 'string') return price;
        return price;
    }
    return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(price);
}

// --- Cart drawer creation ---
function ensureCartDrawer() {
    if (cartDrawer) return cartDrawer;

    cartDrawer = document.createElement('div');
    cartDrawer.className = 'cart-drawer';
    cartDrawer.innerHTML = `
        <div class="drawer-header">
            <strong>Giỏ hàng</strong>
            <div>
                <button id="closeCartBtn" class="icon-btn" aria-label="Đóng">✕</button>
            </div>
        </div>
        <div class="drawer-body" id="drawerBody">
            <div style="color:#666">Đang tải...</div>
        </div>
        <div class="drawer-footer">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><strong>Tổng</strong></div>
                <div id="cartTotal">0₫</div>
            </div>
            <button id="checkoutBtn" class="checkout-btn">Thanh toán</button>
            <button id="clearCartBtn" class="clear-cart-btn">Xóa giỏ hàng</button>
        </div>
    `;
    document.body.appendChild(cartDrawer);

    document.getElementById('closeCartBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCartDrawer();
    });
    
    document.getElementById('checkoutBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleCheckout();
    });
    
    document.getElementById('clearCartBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        clearCart();
    });

    const drawerBody = document.getElementById('drawerBody');
    drawerBody.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (e.target.classList.contains('qty-inc')) {
            const cartId = e.target.closest('.cart-item')?.dataset.cartId;
            if (cartId) updateCartQuantity(cartId, 1);
        } else if (e.target.classList.contains('qty-dec')) {
            const cartId = e.target.closest('.cart-item')?.dataset.cartId;
            if (cartId) updateCartQuantity(cartId, -1);
        } else if (e.target.classList.contains('remove-item')) {
            const cartId = e.target.closest('.cart-item')?.dataset.cartId;
            if (cartId) removeCartItem(cartId);
        }
    });

    cartDrawer.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    return cartDrawer;
}

function toggleCartDrawer() {
    const d = ensureCartDrawer();
    console.log('[Cart] Toggle drawer, currently open:', d.classList.contains('open'));
    d.classList.toggle('open');
    if (d.classList.contains('open')) {
        loadCartItems();
    }
}

function loadCurrentUser() {
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn && userData.id) {
            currentUser = userData;
        } else {
            currentUser = null;
        }
    } catch (e) {
        currentUser = null;
    }
}

async function updateCartBadge() {
    console.log('[Badge] updateCartBadge called');
    loadCurrentUser();
    
    if (!currentUser || !cartBadge) {
        if (cartBadge) cartBadge.style.display = 'none';
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/cart?userId=${currentUser.id}`);
        const items = await res.json();
        const totalQty = items.reduce((s,i)=>s + (i.quantity || 0), 0);
        
        if (totalQty > 0) {
            cartBadge.style.display = 'inline-block';
            cartBadge.textContent = totalQty;
        } else {
            cartBadge.style.display = 'none';
        }
    } catch (e) {
        console.error('[Badge] Error:', e);
        cartBadge.style.display = 'none';
    }
}

async function loadCartItems() {
    loadCurrentUser();
    const body = document.getElementById('drawerBody');
    
    if (!currentUser) {
        body.innerHTML = `<div style="padding:16px;color:#666">Vui lòng <a href="login.html">đăng nhập</a> để xem giỏ hàng.</div>`;
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/cart?userId=${currentUser.id}`);
        let items = await res.json();
        
        if (!items || items.length === 0) {
            body.innerHTML = '<div style="padding:16px;color:#666">Giỏ hàng trống.</div>';
            document.getElementById('cartTotal').textContent = '0₫';
            updateCartBadge();
            return;
        }

        const productsRes = await fetch(`http://localhost:3000/products`);
        const products = await productsRes.json();
        const productsMap = {};
        products.forEach(p => productsMap[p.id] = p);

        body.innerHTML = '';
        let total = 0;
        
        for (const it of items) {
            const prod = productsMap[it.productId] || {};
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.dataset.cartId = it.id;
            itemEl.innerHTML = `
                <img src="${prod.image || './assets/img/img2.png'}" alt="${escapeHtml(prod.name||'')}" />
                <div class="info">
                    <div class="title">${escapeHtml(prod.name || 'Sản phẩm')}</div>
                    <div style="font-size:13px;color:#666">${it.size ? 'Size: '+ it.size : ''} ${it.color ? ' - ' + it.color : ''}</div>
                    <div style="margin-top:6px;font-weight:700;color:#e74c3c">${formatPrice(prod.finalPrice ?? prod.price ?? 0)}</div>
                </div>
                <div class="controls">
                    <button class="qty-dec">−</button>
                    <div style="min-width:34px;text-align:center;">${it.quantity}</div>
                    <button class="qty-inc">+</button>
                    <button class="remove-item" style="margin-left:8px;color:#e74c3c">🗑</button>
                </div>
            `;
            body.appendChild(itemEl);

            const price = (prod.finalPrice ?? prod.price ?? 0) * (it.quantity || 1);
            total += price;
        }

        document.getElementById('cartTotal').textContent = formatPrice(total);
        updateCartBadge();

    } catch (e) {
        console.error('loadCartItems error', e);
        body.innerHTML = '<div style="padding:16px;color:#e74c3c">Không thể tải giỏ hàng.</div>';
    }
}

async function updateCartQuantity(cartId, delta) {
    try {
        const res = await fetch(`http://localhost:3000/cart/${cartId}`);
        if (!res.ok) return;
        const item = await res.json();
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        const patch = await fetch(`http://localhost:3000/cart/${cartId}`, {
            method: 'PATCH',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ quantity: newQty })
        });
        if (patch.ok) {
            await loadCartItems();
        }
    } catch (e) {
        console.error('updateCartQuantity error', e);
    }
}

async function removeCartItem(cartId) {
    if (!confirm('Xác nhận xóa sản phẩm khỏi giỏ?')) return;
    try {
        const res = await fetch(`http://localhost:3000/cart/${cartId}`, { method: 'DELETE' });
        if (res.ok) {
            await loadCartItems();
        }
    } catch (e) {
        console.error('removeCartItem error', e);
    }
}

async function clearCart() {
    if (!confirm('Xóa toàn bộ giỏ hàng?')) return;
    loadCurrentUser();
    if (!currentUser) {
        alert('Vui lòng đăng nhập');
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/cart?userId=${currentUser.id}`);
        const items = await res.json();
        await Promise.all(items.map(i => fetch(`http://localhost:3000/cart/${i.id}`, { method: 'DELETE' })));
        await loadCartItems();
    } catch (e) {
        console.error('clearCart error', e);
    }
}

async function handleCheckout() {
    loadCurrentUser();
    if (!currentUser) {
        alert('Vui lòng đăng nhập để thanh toán');
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/cart?userId=${currentUser.id}`);
        const items = await res.json();
        if (!items || items.length === 0) {
            alert('Giỏ hàng trống');
            return;
        }

        window.location.href = 'checkout.html';

    } catch (e) {
        console.error('checkout error', e);
        alert('Lỗi khi thanh toán: ' + e.message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Search-Cart] Initializing...');
    
    if (!initDOMElements()) {
        console.error('[Search-Cart] Failed to init DOM elements');
        return;
    }

    // Search
    searchToggle.addEventListener('click', () => {
        if (searchBox.style.display === 'none' || !searchBox.style.display) {
            searchBox.style.display = 'inline-block';
            searchInput.focus();
        } else {
            searchBox.style.display = 'none';
            searchResults.innerHTML = '';
        }
    });

    const debouncedSearch = debounce((e) => searchProducts(e.target.value), 300);
    searchInput.addEventListener('input', debouncedSearch);

    document.addEventListener('click', (e) => {
        if (searchBox && !searchBox.contains(e.target) && e.target !== searchToggle) {
            searchResults.innerHTML = '';
        }
    });

    // Cart
    ensureCartDrawer();
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            loadCurrentUser();
            if (!currentUser) {
                if (confirm('Bạn cần đăng nhập để xem giỏ hàng. Đi đến trang đăng nhập?')) {
                    window.location.href = 'login.html';
                }
                return;
            }
            toggleCartDrawer();
        });
    }

    loadCurrentUser();
    updateCartBadge();
    
    console.log('[Search-Cart] Initialized successfully');
});

// Periodic badge update
setInterval(() => {
    updateCartBadge();
}, 3000);