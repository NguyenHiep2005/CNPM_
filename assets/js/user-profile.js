// user-profile.js - Quản lý hiển thị thông tin user
const API_URL = 'http://localhost:3000';

let currentUser = null;

function loadUserProfile() {
    const userData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn && userData) {
        currentUser = JSON.parse(userData);
        updateUserUI();
    } else {
        currentUser = null;
        updateUserUI();
    }
}

function updateUserUI() {
    const userIcon = document.getElementById('userIcon');
    const userMenu = document.getElementById('userMenu');
    
    if (!userIcon) return;
    
    if (currentUser && currentUser.fullname) {
        // User đã đăng nhập - hiển thị thông tin user
        userIcon.innerHTML = `
            <div class="user-profile-dropdown">
                <div class="user-profile-btn" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <i class="fa-solid fa-user-circle" style="font-size: 24px;"></i>
                    <span style="font-size: 14px; color: #333;">${currentUser.fullname}</span>
                </div>
                <div class="user-dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 200px; z-index: 1000;">
                    <div style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
                        <div style="font-weight: 600; color: #333;">${currentUser.fullname}</div>
                        <div style="font-size: 12px; color: #999;">${currentUser.email}</div>
                    </div>
                    <a href="profile.html" style="display: block; padding: 10px 16px; color: #333; text-decoration: none; border-bottom: 1px solid #f0f0f0;">
                        <i class="fa-solid fa-user"></i> Hồ sơ cá nhân
                    </a>
                    <a href="javascript:void(0)" onclick="handleLogout()" style="display: block; padding: 10px 16px; color: #e74c3c; text-decoration: none;">
                        <i class="fa-solid fa-sign-out-alt"></i> Đăng xuất
                    </a>
                </div>
            </div>
        `;
        
        // Setup dropdown toggle
        const profileBtn = userIcon.querySelector('.user-profile-btn');
        const dropdownMenu = userIcon.querySelector('.user-dropdown-menu');
        
        if (profileBtn && dropdownMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
            });
            
            document.addEventListener('click', (e) => {
                if (!userIcon.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
        }
    } else {
        // User chưa đăng nhập - hiển thị link đăng nhập
        userIcon.innerHTML = `<i class="ti-user" onclick="window.location.href='login.html'" style="cursor: pointer; font-size: 18px;"></i>`;
    }
}

function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        currentUser = null;
        updateUserUI();
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    
    // Kiểm tra trạng thái user mỗi 2 giây 
    setInterval(() => {
        const userData = localStorage.getItem('currentUser');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if ((isLoggedIn && userData && !currentUser) || 
            (!isLoggedIn && currentUser)) {
            loadUserProfile();
        }
    }, 2000);
});

// update localStorage thay đổi
window.addEventListener('storage', () => {
    loadUserProfile();
});