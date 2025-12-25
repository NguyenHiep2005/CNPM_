
(function() {
    'use strict';
    
    const API_URL = 'http://localhost:3000';
    const PRODUCTS_PER_PAGE = 8;

    document.addEventListener('DOMContentLoaded', async () => {
        console.log('[Puma] DOMContentLoaded - Script started');
        
        const pumaGrid = document.getElementById('pumaProductsGrid');
        const sortSelect = document.getElementById('sortPuma');
        const minPriceInput = document.getElementById('pumaMinPrice');
        const maxPriceInput = document.getElementById('pumaMaxPrice');
        const applyFilterBtn = document.getElementById('applyPumaFilter');
        const clearFilterBtn = document.getElementById('clearPumaFilter');
        const resultCount = document.getElementById('pumaResultCount');
        const modal = document.getElementById('productModal');
        const modalClose = document.querySelector('.modal-close');
        const closeModalBtn = document.getElementById('closeModalBtn');

        let allProducts = [];
        let filteredProducts = [];
        let currentPage = 1;
        
        async function loadProducts() {
            try {
                console.log('[Puma] Fetching products from API...');
                const response = await fetch(`${API_URL}/products`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                
                const products = await response.json();
                allProducts = products.filter(p => 
                    p.brand && p.brand.toUpperCase() === 'PUMA'
                );
                
                console.log('[Puma] Loaded', allProducts.length, 'Puma products');
                
                if (allProducts.length === 0) {
                    if (resultCount) resultCount.textContent = 'Không có sản phẩm Puma';
                    return;
                }
                
                filteredProducts = [...allProducts];
                renderProducts(filteredProducts, 1);
            } catch (error) {
                console.error('[Puma] Error loading products:', error);
                if (resultCount) resultCount.textContent = 'Lỗi tải sản phẩm';
                if (pumaGrid) pumaGrid.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Lỗi kết nối API. Vui lòng kiểm tra json-server đang chạy.</p>';
            }
        }

        const formatPrice = v => new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(v || 0);

        function renderProducts(products, page = 1) {
            console.log('[Puma] renderProducts called with', products.length, 'products, page:', page);
            
            if (!pumaGrid) {
                console.error('[Puma] pumaGrid element not found!');
                return;
            }
            
            currentPage = page;
            const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
            const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
            const endIndex = startIndex + PRODUCTS_PER_PAGE;
            const productsToShow = products.slice(startIndex, endIndex);
            
            pumaGrid.innerHTML = '';
            
            if (!products || products.length === 0) {
                if (resultCount) resultCount.textContent = 'Không tìm thấy sản phẩm';
                pumaGrid.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Không có sản phẩm nào.</p>';
                renderPagination(0, page);
                return;
            }

            if (resultCount) {
                resultCount.textContent = `${products.length} sản phẩm Puma`;
            }

            productsToShow.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.setAttribute('data-id', product.id);
                card.setAttribute('data-name', product.name);
                card.setAttribute('data-price', product.price);
                card.setAttribute('data-finalprice', product.finalPrice);
                card.setAttribute('data-image', product.image);
                card.setAttribute('data-desc', product.description || '');
                card.setAttribute('data-sizes', (product.size || []).join(','));
                card.setAttribute('data-colors', (product.color || []).join(','));

                card.innerHTML = `
                    <span class="discount-badge">${product.discount || 0}%</span>
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                    <div class="product-name">${product.name}</div>
                    <div>
                        <span class="price-old">${formatPrice(product.price)}</span>
                        <span class="price-new">${formatPrice(product.finalPrice)}</span>
                    </div>
                `;

                pumaGrid.appendChild(card);
            });

            renderPagination(totalPages, page);
        }

        function renderPagination(totalPages, currentPage) {
            let paginationContainer = document.getElementById('pumaPagination');
            
            if (!paginationContainer) {
                paginationContainer = document.createElement('div');
                paginationContainer.id = 'pumaPagination';
                paginationContainer.style.cssText = 'display:flex;justify-content:center;margin:40px 0;';
                pumaGrid.insertAdjacentElement('afterend', paginationContainer);
            }

            if (totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            let html = '<div style="display:flex;gap:8px;align-items:center;">';

            if (currentPage > 1) {
                html += `<button class="page-btn" data-page="${currentPage - 1}" style="min-width:36px;height:36px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;font-size:14px;">‹</button>`;
            }

            const maxVisible = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);

            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            if (startPage > 1) {
                html += `<button class="page-btn" data-page="1" style="min-width:36px;height:36px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;font-size:14px;font-weight:600;">1</button>`;
                if (startPage > 2) {
                    html += `<span style="color:#999;padding:0 4px;">...</span>`;
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === currentPage;
                const activeStyle = isActive ? 'background:#111;color:#fff;border-color:#111;' : '';
                html += `<button class="page-btn ${isActive ? 'active' : ''}" data-page="${i}" style="min-width:36px;height:36px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;font-size:14px;font-weight:600;${activeStyle}">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += `<span style="color:#999;padding:0 4px;">...</span>`;
                }
                html += `<button class="page-btn" data-page="${totalPages}" style="min-width:36px;height:36px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;font-size:14px;font-weight:600;">${totalPages}</button>`;
            }

            if (currentPage < totalPages) {
                html += `<button class="page-btn" data-page="${currentPage + 1}" style="min-width:36px;height:36px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;font-size:14px;">›</button>`;
            }

            html += '</div>';
            paginationContainer.innerHTML = html;

            const pageButtons = paginationContainer.querySelectorAll('.page-btn');
            pageButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.getAttribute('data-page'));
                    renderProducts(filteredProducts, page);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                });
                btn.addEventListener('mouseenter', function() {
                    if (!this.classList.contains('active')) {
                        this.style.background = '#f5f5f5';
                    }
                });
                btn.addEventListener('mouseleave', function() {
                    if (!this.classList.contains('active')) {
                        this.style.background = '#fff';
                    }
                });
            });
        }

        function applyFiltersAndSort() {
            console.log('[Puma] applyFiltersAndSort called');
            let filtered = [...allProducts];

            const minPrice = parseInt(minPriceInput.value) || 0;
            const maxPrice = parseInt(maxPriceInput.value) || Infinity;
            
            filtered = filtered.filter(p => {
                const price = p.finalPrice || p.price || 0;
                return price >= minPrice && price <= maxPrice;
            });

            const sortValue = sortSelect.value;
            
            if (sortValue === 'price-asc') {
                filtered.sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price));
            } else if (sortValue === 'price-desc') {
                filtered.sort((a, b) => (b.finalPrice || b.price) - (a.finalPrice || a.price));
            } else if (sortValue === 'rating-desc') {
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            }

            filteredProducts = filtered;
            renderProducts(filteredProducts, 1);
        }

        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', applyFiltersAndSort);
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', applyFiltersAndSort);
        }

        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                minPriceInput.value = '';
                maxPriceInput.value = '';
                sortSelect.value = 'default';
                filteredProducts = [...allProducts];
                renderProducts(filteredProducts, 1);
            });
        }

        if (pumaGrid) {
            pumaGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                if (!card) return;

                const product = {
                    id: card.getAttribute('data-id'),
                    name: card.getAttribute('data-name'),
                    price: parseInt(card.getAttribute('data-price')),
                    finalPrice: parseInt(card.getAttribute('data-finalprice')),
                    image: card.getAttribute('data-image'),
                    description: card.getAttribute('data-desc'),
                    size: (card.getAttribute('data-sizes') || '').split(',').filter(s => s.trim()),
                    color: (card.getAttribute('data-colors') || '').split(',').filter(c => c.trim())
                };

                document.getElementById('modalProductImg').src = product.image;
                document.getElementById('modalProductName').textContent = product.name;
                document.getElementById('modalProductPriceOld').textContent = formatPrice(product.price);
                document.getElementById('modalProductPriceNew').textContent = formatPrice(product.finalPrice);
                document.getElementById('modalProductDesc').textContent = product.description;

                const sizeSelect = document.getElementById('modalSize');
                sizeSelect.innerHTML = '<option value="">-- Chọn kích cỡ --</option>';
                product.size.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    opt.textContent = s;
                    sizeSelect.appendChild(opt);
                });

                const colorSelect = document.getElementById('modalColor');
                colorSelect.innerHTML = '<option value="">-- Chọn màu --</option>';
                product.color.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    colorSelect.appendChild(opt);
                });

                document.getElementById('modalQty').value = 1;
                window.currentProduct = product;

                modal.style.display = 'block';
                modal.classList.add('active');
            });
        }

        function closeModal() {
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        }

        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', async () => {
                if (!window.currentProduct) return;

                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

                if (!currentUser.id || !isLoggedIn) {
                    if (confirm('Bạn cần đăng nhập để thêm vào giỏ. Đi tới trang đăng nhập?')) {
                        window.location.href = './login.html';
                    }
                    return;
                }

                const sizeVal = document.getElementById('modalSize').value;
                const colorVal = document.getElementById('modalColor').value;
                const qtyVal = parseInt(document.getElementById('modalQty').value, 10) || 1;

                if (!sizeVal || !colorVal) {
                    alert('Vui lòng chọn kích cỡ và màu sắc');
                    return;
                }

                const payload = {
                    userId: currentUser.id,
                    productId: window.currentProduct.id,
                    quantity: qtyVal,
                    selectedSize: sizeVal,
                    selectedColor: colorVal
                };

                try {
                    const res = await fetch(`${API_URL}/cart`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        alert('✓ Đã thêm vào giỏ hàng!');
                        closeModal();
                        if (typeof updateCartBadge === 'function') updateCartBadge();
                    } else {
                        alert('Lỗi khi thêm vào giỏ hàng');
                    }
                } catch (err) {
                    console.error('[Puma] Add to cart error:', err);
                    alert('Lỗi mạng');
                }
            });
        }

        const buyNowBtn = document.getElementById('buyNowBtn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', async () => {
                if (!window.currentProduct) return;

                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

                if (!currentUser.id || !isLoggedIn) {
                    alert('Bạn cần đăng nhập để đặt hàng');
                    window.location.href = './login.html';
                    return;
                }

                const sizeVal = document.getElementById('modalSize').value;
                const colorVal = document.getElementById('modalColor').value;
                const qtyVal = parseInt(document.getElementById('modalQty').value, 10) || 1;

                if (!sizeVal || !colorVal) {
                    alert('Vui lòng chọn kích cỡ và màu sắc');
                    return;
                }

                try {
                    const cartItem = {
                        userId: currentUser.id,
                        productId: window.currentProduct.id,
                        name: window.currentProduct.name,
                        price: window.currentProduct.finalPrice || window.currentProduct.price,
                        image: window.currentProduct.image,
                        size: sizeVal,
                        color: colorVal,
                        quantity: qtyVal
                    };

                    const response = await fetch(`${API_URL}/cart`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cartItem)
                    });

                    if (response.ok) {
                        closeModal();
                        window.location.href = 'checkout.html';
                    } else {
                        alert('Lỗi khi thêm vào giỏ hàng');
                    }
                } catch (err) {
                    console.error('[Puma] Buy now error:', err);
                    alert('Lỗi: ' + err.message);
                }
            });
        }

        await loadProducts();
    });
})();