const API_URL = 'http://localhost:3000';

// Toggle mật khẩu
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleIcon = event.target;
    
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

// Xử lý submit form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const agree = document.getElementById('agree').checked;
    
    // Validate
    const errors = validateRegisterForm(fullname, username, email, password, confirmPassword, phone, address, agree);
    
    if (Object.keys(errors).length > 0) {
        displayErrors(errors);
        return;
    }
    
    // Đăng ký
    const result = await performRegister(fullname, username, email, password, phone, address);
    
    if (result.success) {
        //Lấy nút submit
        const loginBtn = document.querySelector('.login-btn');
        
        // Thay đổi giao diện nút
        loginBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đăng ký thành công!';
        loginBtn.style.background = 'linear-gradient(135deg, #3ad29f 0%, #2ecc71 100%)';
       
        
        // Hiển thị thông báo thành công và giữ lại
        showSuccessMessage('Đăng ký thành công! Tài khoản của bạn đã được tạo.');
        
        console.log('✓ Đăng ký thành công:', result.user.fullname);
        
        // Reset form sau 3 giây 
        setTimeout(() => {
                window.location.href = 'index.html';
        }, 1500);
    } else {
        displayErrors({ general: result.message });
    }
});

// Validate form
function validateRegisterForm(fullname, username, email, password, confirmPassword, phone, address, agree) {
    const errors = {};
    
    if (!fullname || fullname === '') {
        errors.fullname = 'Vui lòng nhập họ và tên';
    } else if (fullname.length < 3) {
        errors.fullname = 'Họ và tên phải ít nhất 3 ký tự';
    }
    
    if (!username || username === '') {
        errors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (username.length < 4 || username.length > 20) {
        errors.username = 'Tên đăng nhập phải từ 4-20 ký tự';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.username = 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới';
    }
    
    if (!email || email === '') {
        errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Email không hợp lệ';
    }
    
    if (!password || password === '') {
        errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
        errors.password = 'Mật khẩu phải ít nhất 6 ký tự';
    }
    
    if (password !== confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
        errors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)';
    }
    
    if (!agree) {
        errors.agree = 'Vui lòng đồng ý với điều khoản sử dụng';
    }
    
    return errors;
}

// Hiển thị lỗi
function displayErrors(errors) {
    const errorFields = ['fullname', 'username', 'email', 'password', 'confirmPassword', 'phone', 'address', 'agree'];
    
    errorFields.forEach(field => {
        const errorEl = document.getElementById(field + 'Error');
        if (errorEl) {
            errorEl.innerHTML = errors[field] || '';
            errorEl.style.display = errors[field] ? 'block' : 'none';
        }
    });
    
    if (errors.general) {
        const successMsg = document.getElementById('successMessage');
        successMsg.innerHTML = `<i class="fa-solid fa-exclamation-circle"></i> ${errors.general}`;
        successMsg.style.background = '#f8d7da';
        successMsg.style.color = '#721c24';
        successMsg.style.display = 'block';
    }
}

// Hiển thị tin nhắn thành công
function showSuccessMessage(message) {
    const successMsg = document.getElementById('successMessage');
    successMsg.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    successMsg.style.background = '#d4edda';
    successMsg.style.color = '#155724';
    successMsg.style.display = 'block';
}

// Thực hiện đăng ký
async function performRegister(fullname, username, email, password, phone, address) {
    try {
        let response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        let users = await response.json();
        
        if (users.length > 0) {
            return { success: false, message: 'Email đã được sử dụng' };
        }
        
        response = await fetch(`${API_URL}/users?username=${encodeURIComponent(username)}`);
        users = await response.json();
        
        if (users.length > 0) {
            return { success: false, message: 'Tên đăng nhập đã tồn tại' };
        }
        
        const newUser = {
            email: email,
            username: username,
            password: password,
            fullname: fullname,
            phone: phone || '',
            address: address || '',
            createdAt: new Date().toISOString()
        };
        
        console.log('[Register] Creating new user:', newUser);
        
        response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const createdUser = await response.json();
        console.log('[Register] User created successfully:', createdUser);
        
        return { success: true, message: 'Đăng ký thành công!', user: createdUser };
        
    } catch (error) {
        console.error('[Register] Error:', error);
        return { success: false, message: 'Lỗi kết nối server: ' + error.message };
    }
}