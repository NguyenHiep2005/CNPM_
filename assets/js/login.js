// login.js - Xử lý đăng nhập
const API_URL = 'http://localhost:3000';

// Toggle mật khẩu
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Xử lý đăng nhập
async function performLogin(email, password) {
    try {
        // Tìm kiếm user theo email hoặc username
        let response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        let users = await response.json();
        
        // Nếu không tìm thấy email, tìm theo username
        if (users.length === 0) {
            response = await fetch(`${API_URL}/users?username=${encodeURIComponent(email)}`);
            users = await response.json();
        }
        
        if (users.length === 0) {
            return { success: false, message: 'Email hoặc tên đăng nhập không tồn tại' };
        }
        
        const user = users[0];
        
        // Kiểm tra mật khẩu
        if (user.password !== password) {
            return { success: false, message: 'Mật khẩu không chính xác' };
        }
        
        // Lưu dữ liệu user
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            fullname: user.fullname,
            phone: user.phone || '',
            address: user.address || ''
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        return { success: true, message: 'Đăng nhập thành công', user: userData };
        
    } catch (error) {
        console.error('Lỗi:', error);
        return { success: false, message: 'Lỗi kết nối server: ' + error.message };
    }
}

// Validate form
function validateLoginForm(email, password) {
    const errors = {};
    
    if (!email || email.trim() === '') {
        errors.email = 'Vui lòng nhập email hoặc tên đăng nhập';
    }
    
    if (!password || password === '') {
        errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
        errors.password = 'Mật khẩu phải ít nhất 6 ký tự';
    }
    
    return errors;
}

// Hiển thị lỗi
function displayErrors(errors) {
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    emailError.innerHTML = '';
    passwordError.innerHTML = '';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    
    if (errors.email) {
        emailError.innerHTML = errors.email;
        emailError.style.display = 'block';
    }
    
    if (errors.password) {
        passwordError.innerHTML = errors.password;
        passwordError.style.display = 'block';
    }
}

// Xử lý submit form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('.login-btn');
        
        // Validate
        const errors = validateLoginForm(email, password);
        if (Object.keys(errors).length > 0) {
            displayErrors(errors);
            return;
        }
        
        // Clear errors
        displayErrors({});
        
        // Show loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...';
        
        // Perform login
        const result = await performLogin(email, password);
        
        if (result.success) {
            // Success - show success message
            loginBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đăng nhập thành công!';
            loginBtn.style.background = '#3ad29f';
            
            console.log('✓ Đăng nhập thành công:', result.user.fullname);
            
            // Redirect to home after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Error - show error and reset button
            displayErrors({
                password: result.message
            });
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Đăng Nhập';
            
            console.error('✗ Lỗi đăng nhập:', result.message);
        }
    });
});

// Kiểm tra nếu đã đăng nhập
window.addEventListener('load', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn && currentUser) {
        console.log('Người dùng đã đăng nhập, tự động chuyển về trang chủ');
        // Bỏ comment nếu muốn tự động redirect
        // window.location.href = 'index.html';
    }
});