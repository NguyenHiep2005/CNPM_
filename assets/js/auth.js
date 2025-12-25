

class AuthManager {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentUser = this.loadUser();
    }
    
    
    loadUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }
    
    
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true' && this.currentUser !== null;
    }
    
    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/users?email=${email}`);
            const users = await response.json();
            
            if (users.length === 0) {
                return { success: false, message: 'Email NOT' };
            }
            
            const user = users[0];
            
            if (user.password !== password) {
                return { success: false, message: 'Password incorrect' };
            }
            
            const userData = {
                id: user.id,
                email: user.email,
                username: user.username,
                fullname: user.fullname,
                phone: user.phone,
                address: user.address
            };
            
            this.currentUser = userData;
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');
            
            return { success: true, message: 'Login successful', user: userData };
        } catch (error) {
            return { success: false, message: 'Errors ' + error.message };
        }
    }
    
    // Logout
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        this.currentUser = null;
        window.location.href = 'index.html';
    }
    
   
    async register(userData) {
        try {
            
            const existingEmail = await fetch(`${this.API_URL}/users?email=${userData.email}`);
            const users = await existingEmail.json();
            
            if (users.length > 0) {
                return { success: false, message: 'Email ' };
            }
            
            
            const existingUsername = await fetch(`${this.API_URL}/users?username=${userData.username}`);
            const usernameUsers = await existingUsername.json();
            
            if (usernameUsers.length > 0) {
                return { success: false, message: 'Username already exists' };
            }
            
           
            const newUser = {
                email: userData.email,
                username: userData.username,
                password: userData.password,
                fullname: userData.fullname,
                phone: userData.phone || '',
                address: userData.address || '',
                createdAt: new Date().toISOString()
            };
            
            const response = await fetch(`${this.API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });
            
            if (!response.ok) {
                throw new Error('Failed to register user');
            }
            
            const createdUser = await response.json();
            
            return { 
                success: true, 
                message: 'User registered successfully',
                user: createdUser 
            };
        } catch (error) {
            return { success: false, message: 'Erro: ' + error.message };
        }
    }
    
   
    async getUserProfile(userId) {
        try {
            const response = await fetch(`${this.API_URL}/users/${userId}`);
            if (!response.ok) throw new Error('');
            return await response.json();
        } catch (error) {
            return null;
        }
    }
    
    
    async updateUserProfile(userId, updates) {
        try {
            const response = await fetch(`${this.API_URL}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Failed to update profile');
            
            const updatedUser = await response.json();
            this.currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            return { success: true, user: updatedUser };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}


const auth = new AuthManager();