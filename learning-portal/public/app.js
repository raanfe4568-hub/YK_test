const API_URL = window.location.origin; // Используем текущий домен

class LearningPortal {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.api = {
            async request(endpoint, options = {}) {
                const url = `${API_URL}/api${endpoint}`;
                
                const headers = {
                    'Content-Type': 'application/json',
                    ...options.headers
                };
                
                // Добавляем токен авторизации, если есть
                if (this.token) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                }
                
                const response = await fetch(url, {
                    ...options,
                    headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response.json();
            },
            
            async health() {
                return this.request('/health');
            },
            
            async login(email, password) {
                return this.request('/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
            },
            
            async register(userData) {
                return this.request('/register', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
            },
            
            async getProfile() {
                return this.request('/profile');
            },
            
            async getCourses() {
                return this.request('/courses');
            },
            
            async enrollCourse(courseId) {
                return this.request(`/courses/${courseId}/enroll`, {
                    method: 'POST'
                });
            },
            
            async createTicket(ticketData) {
                return this.request('/tickets', {
                    method: 'POST',
                    body: JSON.stringify(ticketData)
                });
            },
            
            async getStats() {
                return this.request('/stats');
            }
        };
        
        // Привязываем контекст
        this.api.request = this.api.request.bind(this);
        this.api.health = this.api.health.bind(this);
        this.api.login = this.api.login.bind(this);
        this.api.register = this.api.register.bind(this);
        this.api.getProfile = this.api.getProfile.bind(this);
        this.api.getCourses = this.api.getCourses.bind(this);
        this.api.enrollCourse = this.api.enrollCourse.bind(this);
        this.api.createTicket = this.api.createTicket.bind(this);
        this.api.getStats = this.api.getStats.bind(this);
    }
    
    async init() {
        // Проверяем сервер
        await this.checkServer();
        
        // Если есть токен, загружаем профиль
        if (this.token) {
            try {
                this.user = await this.api.getProfile();
                this.showDashboard();
            } catch (error) {
                localStorage.removeItem('token');
                this.token = null;
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }
    
    async checkServer() {
        const statusBar = document.getElementById('statusBar');
        
        try {
            const health = await this.api.health();
            statusBar.className = 'status-bar online';
            statusBar.innerHTML = '<i class="fas fa-check-circle"></i> Сервер онлайн';
            
            setTimeout(() => {
                statusBar.style.display = 'none';
            }, 3000);
            
            return true;
        } catch (error) {
            statusBar.className = 'status-bar offline';
            statusBar.innerHTML = '<i class="fas fa-exclamation-circle"></i> Сервер недоступен';
            return false;
        }
    }
    
    showLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-container">
                    <div class="card">
                        <div class="card-header">
                            <h1 class="card-title">Портал обучения YK</h1>
                            <p class="card-subtitle">Войдите в систему для продолжения</p>
                        </div>
                        
                        <form id="loginForm" onsubmit="return false">
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="email" class="form-input" placeholder="admin@portal.ru" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Пароль</label>
                                <input type="password" id="password" class="form-input" placeholder="admin123" required>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-block" onclick="portal.loginHandler()">
                                <i class="fas fa-sign-in-alt"></i> Войти
                            </button>
                        </form>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button class="btn btn-success" onclick="portal.showRegister()">
                                <i class="fas fa-user-plus"></i> Регистрация
                            </button>
                        </div>
                        
                        <div class="test-users">
                            <h4 style="margin-bottom: 12px;">Тестовые аккаунты:</h4>
                            <div class="test-user" onclick="portal.fillLogin('admin@portal.ru', 'admin123')">
                                <strong>admin@portal.ru</strong> / admin123 👑 Администратор
                            </div>
                            <div class="test-user" onclick="portal.fillLogin('user@portal.ru', 'user123')">
                                <strong>user@portal.ru</strong> / user123 🎓 Пользователь
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Обработчик Enter
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loginHandler();
        });
    }
    
    async loginHandler() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.querySelector('#loginForm button');
        
        if (!email || !password) {
            alert('Заполните все поля');
            return;
        }
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        btn.disabled = true;
        
        try {
            const result = await this.api.login(email, password);
            
            this.token = result.token;
            this.user = result.user;
            
            localStorage.setItem('token', this.token);
            this.showDashboard();
            
        } catch (error) {
            alert('Ошибка входа: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    showDashboard() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="dashboard">
                <div class="card" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1 class="card-title">Добро пожаловать, ${this.user.name}!</h1>
                            <p class="card-subtitle">${this.getRoleDisplay(this.user.role)}</p>
                        </div>
                        <button class="btn btn-danger" onclick="portal.logout()">
                            <i class="fas fa-sign-out-alt"></i> Выйти
                        </button>
                    </div>
                </div>
                
                <div class="dashboard-grid grid grid-3">
                    <div class="card stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">${this.user.learningStats.enrolledCourses.length}</div>
                        <div class="stat-label">Мои курсы</div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${this.user.learningStats.totalHours}ч</div>
                        <div class="stat-label">Часы обучения</div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${this.user.learningStats.completedCourses.length}</div>
                        <div class="stat-label">Пройдено курсов</div>
                    </div>
                </div>
                
                <div class="card" style="margin-top: 30px;">
                    <h2 style="margin-bottom: 20px;">📊 Системная информация</h2>
                    <div id="statsInfo">Загрузка...</div>
                </div>
            </div>
        `;
        
        this.loadStats();
    }
    
    async loadStats() {
        try {
            const stats = await this.api.getStats();
            const statsInfo = document.getElementById('statsInfo');
            statsInfo.innerHTML = `
                <div class="grid grid-2" style="gap: 15px;">
                    <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <strong>👥 Пользователей:</strong> ${stats.totalUsers}
                    </div>
                    <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <strong>📚 Курсов:</strong> ${stats.totalCourses}
                    </div>
                    <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <strong>🎫 Обращений:</strong> ${stats.totalTickets}
                    </div>
                    <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <strong>⏱️ Всего часов обучения:</strong> ${stats.totalLearningHours}ч
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }
    
    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.user = null;
        this.showLogin();
    }
    
    fillLogin(email, password) {
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
    }
    
    getRoleDisplay(role) {
        const roles = {
            'administrator': '👑 Администратор',
            'manager': '📊 Менеджер',
            'user': '🎓 Пользователь'
        };
        return roles[role] || role;
    }
    
    showRegister() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-container">
                    <div class="card">
                        <div class="card-header">
                            <h1 class="card-title">Регистрация</h1>
                            <p class="card-subtitle">Создайте новую учетную запись</p>
                        </div>
                        
                        <form id="registerForm" onsubmit="return false">
                            <div class="form-group">
                                <label class="form-label">Имя</label>
                                <input type="text" id="regName" class="form-input" placeholder="Ваше имя" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="regEmail" class="form-input" placeholder="example@mail.ru" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Пароль</label>
                                <input type="password" id="regPassword" class="form-input" placeholder="Минимум 6 символов" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Подтверждение пароля</label>
                                <input type="password" id="regConfirm" class="form-input" placeholder="Повторите пароль" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Роль</label>
                                <select id="regRole" class="form-input">
                                    <option value="user">🎓 Пользователь</option>
                                    <option value="manager">📊 Менеджер</option>
                                </select>
                            </div>
                            
                            <div style="display: flex; gap: 10px;">
                                <button type="submit" class="btn btn-success btn-block" onclick="portal.registerHandler()">
                                    <i class="fas fa-user-plus"></i> Зарегистрироваться
                                </button>
                                
                                <button class="btn btn-secondary" onclick="portal.showLogin()">
                                    <i class="fas fa-arrow-left"></i> Назад
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    async registerHandler() {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;
        const role = document.getElementById('regRole').value;
        const btn = document.querySelector('#registerForm button[type="submit"]');
        
        if (!name || !email || !password || !confirm) {
            alert('Заполните все поля');
            return;
        }
        
        if (password !== confirm) {
            alert('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
        btn.disabled = true;
        
        try {
            const result = await this.api.register({ name, email, password, role });
            
            alert('Регистрация успешна! Теперь войдите в систему.');
            this.showLogin();
            
        } catch (error) {
            alert('Ошибка регистрации: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// Создаем глобальный объект портала
const portal = new LearningPortal();

// Инициализируем при загрузке
document.addEventListener('DOMContentLoaded', () => {
    portal.init();
});

// Функция для проверки сервера (вызывается из HTML)
function checkServerStatus() {
    portal.checkServer();
}