// assets/js/index-products.js
(function() {
    'use strict';
    
    const API_URL = 'http://localhost:3000';

    document.addEventListener('DOMContentLoaded', async () => {
        console.log('[Index] Loading products...');
        await loadAllProducts();
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };

    async function loadAllProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const products = await response.json();
            console.log('[Index] Loaded', products.length, 'products');

            // Phân loại sản phẩm theo brand
            const nikeProducts = products.filter(p => p.brand && p.brand.toUpperCase() === 'NIKE');
            const adidasProducts = products.filter(p => p.brand && p.brand.toUpperCase() === 'ADIDAS');
            const pumaProducts = products.filter(p => p.brand && p.brand.toUpperCase() === 'PUMA');

            // Render từng section
            renderProductSection('.content-3', nikeProducts.slice(0, 8), 'Nike');
            renderProductSection('.content-5', adidasProducts.slice(0, 8), 'Adidas');
            
            // Thêm section Puma (giữa content-5 và content-6)
            addPumaSection(pumaProducts.slice(0, 8));
            
            // Thêm section Nike thứ 2 sau Puma
            addNike2Section(nikeProducts.slice(8, 16));

        } catch (error) {
            console.error('[Index] Error loading products:', error);
        }
    }

    function renderProductSection(selector, products, brandName) {
        const container = document.querySelector(selector);
        if (!container) {
            console.warn(`[Index] Container ${selector} not found`);
            return;
        }

        container.innerHTML = '';

        products.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });

        console.log(`[Index] Rendered ${products.length} ${brandName} products in ${selector}`);
    }

    function createProductCard(product) {
        const card = document.createElement('a');
        card.className = 'product-card';
        card.href = `products.html?id=${product.id}`;
        // Xóa dấu gạch chân
        card.style.textDecoration = 'none';

        card.innerHTML = `
            <span class="discount-badge">${product.discount || 0}%</span>
            <img class="product-img" src="${product.image}" alt="${product.name}">
            <div class="product-name">${product.name}</div>
            <div>
                <span class="price-old">${formatPrice(product.price)}</span>
                <span class="price-new">${formatPrice(product.finalPrice)}</span>
            </div>
        `;

        return card;
    }

    function addPumaSection(products) {
        const content5 = document.querySelector('.content-5');
        if (!content5) return;

        // Tạo header cho Puma
        const pumaHeader = document.createElement('div');
        pumaHeader.className = 'content-4 center-content';
        pumaHeader.style.marginTop = '60px';
        pumaHeader.innerHTML = `
            <div class="content-4-1">
                <h2 class="title-1">GIÀY PUMA 
                    <a class="sub-title-1">CHẤT LƯỢNG CAO</a>
                </h2>
            </div>
        `;

        // Tạo grid cho Puma
        const pumaGrid = document.createElement('div');
        pumaGrid.className = 'content-puma grid-template';
        pumaGrid.style.marginBottom = '40px';

        products.forEach(product => {
            const productCard = createProductCard(product);
            pumaGrid.appendChild(productCard);
        });

        // Insert sau content-5
        content5.insertAdjacentElement('afterend', pumaGrid);
        pumaGrid.insertAdjacentElement('beforebegin', pumaHeader);

        console.log(`[Index] Added Puma section with ${products.length} products`);
    }

    function addNike2Section(products) {
        const pumaGrid = document.querySelector('.content-puma');
        if (!pumaGrid) return;

        // Tạo header cho Nike 2
        const nike2Header = document.createElement('div');
        nike2Header.className = 'content-4 center-content';
        nike2Header.style.marginTop = '60px';
        nike2Header.innerHTML = `
            <div class="content-4-1">
                <h2 class="title-1">GIÀY NIKE 
                    <a class="sub-title-1">PHIÊN BẢN MỚI</a>
                </h2>
            </div>
        `;

        // Tạo grid cho Nike 2
        const nike2Grid = document.createElement('div');
        nike2Grid.className = 'content-nike2 grid-template';
        nike2Grid.style.marginBottom = '40px';

        products.forEach(product => {
            const productCard = createProductCard(product);
            nike2Grid.appendChild(productCard);
        });

        // Insert sau Puma grid
        pumaGrid.insertAdjacentElement('afterend', nike2Grid);
        nike2Grid.insertAdjacentElement('beforebegin', nike2Header);

        console.log(`[Index] Added Nike 2 section with ${products.length} products`);
    }

})();