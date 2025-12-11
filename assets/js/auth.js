// auth.js - Gerenciador de autenticação global

class AuthManager {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentUser = this.loadUser();
    }
    
    // Carregar usuário do localStorage
    loadUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }
    
    // Verificar se está logado
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true' && this.currentUser !== null;
    }
    
    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/users?email=${email}`);
            const users = await response.json();
            
            if (users.length === 0) {
                return { success: false, message: 'Email não encontrado' };
            }
            
            const user = users[0];
            
            if (user.password !== password) {
                return { success: false, message: 'Senha incorreta' };
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
            
            return { success: true, message: 'Login realizado com sucesso', user: userData };
        } catch (error) {
            return { success: false, message: 'Erro ao conectar: ' + error.message };
        }
    }
    
    // Logout
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        this.currentUser = null;
        window.location.href = 'index.html';
    }
    
    // Registrar novo usuário
    async register(userData) {
        try {
            // Verificar se email já existe
            const existingEmail = await fetch(`${this.API_URL}/users?email=${userData.email}`);
            const users = await existingEmail.json();
            
            if (users.length > 0) {
                return { success: false, message: 'Email já cadastrado' };
            }
            
            // Verificar se username já existe
            const existingUsername = await fetch(`${this.API_URL}/users?username=${userData.username}`);
            const usernameUsers = await existingUsername.json();
            
            if (usernameUsers.length > 0) {
                return { success: false, message: 'Nome de usuário já existe' };
            }
            
            // Criar novo usuário
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
                throw new Error('Erro ao criar usuário');
            }
            
            const createdUser = await response.json();
            
            return { 
                success: true, 
                message: 'Usuário registrado com sucesso',
                user: createdUser 
            };
        } catch (error) {
            return { success: false, message: 'Erro: ' + error.message };
        }
    }
    
    // Obter perfil do usuário
    async getUserProfile(userId) {
        try {
            const response = await fetch(`${this.API_URL}/users/${userId}`);
            if (!response.ok) throw new Error('Usuário não encontrado');
            return await response.json();
        } catch (error) {
            return null;
        }
    }
    
    // Atualizar perfil do usuário
    async updateUserProfile(userId, updates) {
        try {
            const response = await fetch(`${this.API_URL}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Erro ao atualizar perfil');
            
            const updatedUser = await response.json();
            this.currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            return { success: true, user: updatedUser };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Instância global
const auth = new AuthManager();