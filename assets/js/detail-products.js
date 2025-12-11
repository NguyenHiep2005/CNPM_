
// DOM elements

let pImg, pName, pPriceOld, pPriceNew, pDesc, discountBadge, discountPercent;
let colorButtons, sizeButtons, qtyInput, minusBtn, plusBtn, buyBtn, addCartBtn;
let stockStatus, ratingStars, reviewCount;

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

function initDOMElements() {
    pImg = document.getElementById('p-img');
    pName = document.getElementById('p-name');
    pPriceOld = document.getElementById('p-price-old');
    pPriceNew = document.getElementById('p-price-new');
    pDesc = document.getElementById('p-desc');
    discountBadge = document.getElementById('discountBadge');
    discountPercent = document.getElementById('discountPercent');
    colorButtons = document.getElementById('colorButtons');
    sizeButtons = document.getElementById('sizeButtons');
    qtyInput = document.getElementById('qty');
    minusBtn = document.getElementById('minus');
    plusBtn = document.getElementById('plus');
    buyBtn = document.getElementById('buy');
    addCartBtn = document.getElementById('addcart');
    stockStatus = document.getElementById('stockStatus');
    ratingStars = document.getElementById('ratingStars');
    reviewCount = document.getElementById('reviewCount');
}

function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function renderStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<i class="fa-solid fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            starsHtml += '<i class="fa-regular fa-star"></i>';
        }
    }
    
    ratingStars.innerHTML = starsHtml;
}

async function loadProduct() {
    const productId = getProductId();
    console.log('[Product] Loading product with ID:', productId);
    
    if (!productId) {
        showNotFound();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        console.log('[Product] Response status:', response.status);
        
        if (!response.ok) {
            showNotFound();
            return;
        }
        
        currentProduct = await response.json();
        console.log('[Product] Loaded:', currentProduct);
        renderProduct();
    } catch (error) {
        console.error('[Product] Error loading product:', error);
        showNotFound();
    }
}

function showNotFound() {
    if (!pName) return;
    pName.textContent = 'Sản phẩm không tồn tại';
    pDesc.textContent = 'Vui lòng quay lại trang chính';
    pImg.src = './assets/img/img2.png';
}

function renderProduct() {
    if (!currentProduct || !pName) return;
    
    console.log('[Product] Rendering product:', currentProduct.name);
    
    // Thông tin cơ bản
    pImg.src = currentProduct.image;
    pImg.alt = currentProduct.name;
    pName.textContent = currentProduct.name;
    pPriceOld.textContent = formatPrice(currentProduct.price);
    pPriceNew.textContent = formatPrice(currentProduct.finalPrice);
    pDesc.textContent = currentProduct.description;
    
    // Giảm giá
    if (currentProduct.discount) {
        discountBadge.textContent = currentProduct.discount + '%';
        discountPercent.textContent = `-${currentProduct.discount}%`;
    }
    
    // Đánh giá
    renderStars(currentProduct.rating);
    reviewCount.textContent = `(${currentProduct.reviews} đánh giá)`;
    
    // Kho hàng
    if (currentProduct.stock > 0) {
        stockStatus.textContent = `Có ${currentProduct.stock} sản phẩm`;
        stockStatus.className = 'stock-status in-stock';
    } else {
        stockStatus.textContent = 'Hết hàng';
        stockStatus.className = 'stock-status out-of-stock';
        buyBtn.disabled = true;
        addCartBtn.disabled = true;
    }
    
    // Màu sắc
    if (currentProduct.color && currentProduct.color.length > 0) {
        colorButtons.innerHTML = '';
        currentProduct.color.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-option';
            btn.textContent = color;
            btn.dataset.color = color;
            
            if (index === 0) {
                btn.classList.add('active');
                selectedColor = color;
            }
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedColor = color;
            });
            
            colorButtons.appendChild(btn);
        });
    }
    
    // Kích cỡ
    if (currentProduct.size && currentProduct.size.length > 0) {
        sizeButtons.innerHTML = '';
        currentProduct.size.forEach((size, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'size-option';
            btn.textContent = size;
            btn.dataset.size = size;
            
            if (index === 0) {
                btn.classList.add('active');
                selectedSize = size;
            }
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = size;
            });
            
            sizeButtons.appendChild(btn);
        });
    }
}

function setupQuantityControls() {
    minusBtn.addEventListener('click', () => {
        let value = parseInt(qtyInput.value, 10);
        if (value > 1) {
            qtyInput.value = value - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        let value = parseInt(qtyInput.value, 10);
        if (value < (currentProduct?.stock || 99)) {
            qtyInput.value = value + 1;
        }
    });
}

function setupAddToCart() {
    addCartBtn.addEventListener('click', async () => {
        if (!selectedSize) {
            alert('Vui lòng chọn kích cỡ');
            return;
        }
        
        // Kiểm tra đăng nhập sử dụng localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (!currentUser.id || !isLoggedIn) {
            alert('Vui lòng đăng nhập để thêm vào giỏ');
            window.location.href = 'login.html';
            return;
        }
        
        if (!currentProduct) {
            alert('Sản phẩm không tồn tại');
            return;
        }

        const cartItem = {
            userId: currentUser.id,
            productId: currentProduct.id,
            name: currentProduct.name || 'Sản phẩm không xác định',
            price: currentProduct.finalPrice || currentProduct.price || 0,
            image: currentProduct.image || './assets/img/mau1.jpg',
            size: selectedSize,
            color: selectedColor || 'Mặc định',
            quantity: parseInt(qtyInput.value) || 1
        };
        
        console.log('[AddCart] Saving item:', cartItem);
        
        try {
            const response = await fetch('http://localhost:3000/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cartItem)
            });
            
            if (response.ok) {
                alert('✓ Đã thêm vào giỏ hàng!');
                if (window.updateCartBadge) {
                    updateCartBadge();
                }
            } else {
                const error = await response.text();
                console.error('[AddCart] Server error:', error);
                alert('Lỗi khi thêm vào giỏ hàng');
            }
        } catch (error) {
            console.error('[AddCart] Error:', error);
            alert('Lỗi khi thêm vào giỏ hàng: ' + error.message);
        }
    });
}

function setupBuyNow() {
    buyBtn.addEventListener('click', async () => {
        if (!selectedSize) {
            alert('Vui lòng chọn kích cỡ');
            return;
        }

        // Check login status using new system
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        
        if (!currentUser.id || !isLoggedIn) {
            alert('Vui lòng đăng nhập để mua hàng');
            window.location.href = 'login.html';
            return;
        }

        try {
            // Add item to cart
            const cartItem = {
                userId: currentUser.id,
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.finalPrice || currentProduct.price,
                image: currentProduct.image,
                size: selectedSize,
                color: selectedColor || 'Mặc định',
                quantity: parseInt(qtyInput.value)
            };

            const response = await fetch('http://localhost:3000/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartItem)
            });

            if (response.ok) {
                // Redirect to checkout
                window.location.href = 'checkout.html';
            } else {
                alert('Lỗi khi thêm vào giỏ hàng');
            }
        } catch (error) {
            console.error('Buy now error:', error);
            alert('Lỗi: ' + error.message);
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('[Detail Products] Initializing...');
    initDOMElements();
    setupQuantityControls();
    setupAddToCart();
    setupBuyNow();
    loadProduct();
    console.log('[Detail Products] Initialized');
});