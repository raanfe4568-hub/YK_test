const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'learning_portal_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json());

// База данных в памяти
let db = {
  users: [
    {
      id: 1,
      email: 'admin@portal.ru',
      password: bcrypt.hashSync('admin123', 10),
      name: 'Администратор Системы',
      role: 'administrator',
      registrationDate: new Date().toISOString(),
      learningStats: {
        totalHours: 15,
        completedCourses: [1, 2],
        testResults: [
          { courseId: 1, score: 95, date: new Date().toISOString() },
          { courseId: 2, score: 88, date: new Date().toISOString() }
        ],
        enrolledCourses: [1, 2, 3]
      }
    },
    {
      id: 2,
      email: 'user@portal.ru',
      password: bcrypt.hashSync('user123', 10),
      name: 'Обычный Пользователь',
      role: 'user',
      registrationDate: new Date().toISOString(),
      learningStats: {
        totalHours: 8,
        completedCourses: [1],
        testResults: [
          { courseId: 1, score: 78, date: new Date().toISOString() }
        ],
        enrolledCourses: [1, 3]
      }
    }
  ],
  courses: [
    {
      id: 1,
      title: 'Основы работы с системой',
      description: 'Базовый курс по работе с порталом обучения',
      duration: '2 часа',
      category: 'Обязательный',
      lessons: 5,
      materials: [
        { id: 1, type: 'presentation', title: 'Введение в систему' },
        { id: 2, type: 'video', title: 'Видео-инструкция' }
      ]
    },
    {
      id: 2,
      title: 'Безопасность информации',
      description: 'Курс по основам информационной безопасности',
      duration: '4 часа',
      category: 'Безопасность',
      lessons: 8,
      materials: [
        { id: 3, type: 'document', title: 'Руководство по безопасности' }
      ]
    }
  ],
  tickets: [],
  tests: []
};

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется токен авторизации' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
};

// Статический файл HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Портал обучения YK</title>
        <style>
            :root {
                --primary: #667eea;
                --secondary: #764ba2;
                --success: #10b981;
                --warning: #f59e0b;
                --danger: #ef4444;
                --dark: #1f2937;
                --light: #f9fafb;
                --border: #e5e7eb;
                --bg-primary: #ffffff;
                --text-primary: #374151;
                --text-secondary: #6b7280;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .container {
                background: var(--bg-primary);
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                padding: 30px;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
            }

            .title {
                font-size: 28px;
                font-weight: 700;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 10px;
            }

            .subtitle {
                color: var(--text-secondary);
                font-size: 14px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--text-primary);
                font-size: 14px;
            }

            .form-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--border);
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }

            .form-input:focus {
                outline: none;
                border-color: var(--primary);
            }

            .btn {
                width: 100%;
                padding: 14px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                color: white;
                margin-top: 10px;
            }

            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }

            .test-users {
                margin-top: 25px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 4px solid var(--primary);
            }

            .test-user {
                padding: 12px;
                margin: 8px 0;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                border: 1px solid var(--border);
            }

            .test-user:hover {
                background: var(--primary);
                color: white;
                transform: translateX(5px);
            }

            .status-bar {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 15px;
                border-radius: 25px;
                font-size: 12px;
                font-weight: 600;
                background: var(--success);
                color: white;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            }

            .loader {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
                margin-right: 8px;
                vertical-align: middle;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .hidden {
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">Портал обучения YK</h1>
                <p class="subtitle">Войдите в систему</p>
            </div>

            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="email" class="form-input" placeholder="admin@portal.ru">
            </div>

            <div class="form-group">
                <label class="form-label">Пароль</label>
                <input type="password" id="password" class="form-input" placeholder="admin123">
            </div>

            <button class="btn" onclick="login()" id="loginBtn">
                <span id="loginText">🔐 Войти в систему</span>
            </button>

            <div class="test-users">
                <h4 style="margin-bottom: 12px;">Тестовые аккаунты:</h4>
                <div class="test-user" onclick="fillLogin('admin@portal.ru', 'admin123')">
                    <strong>admin@portal.ru</strong> / admin123 👑 Администратор
                </div>
                <div class="test-user" onclick="fillLogin('user@portal.ru', 'user123')">
                    <strong>user@portal.ru</strong> / user123 🎓 Пользователь
                </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button onclick="showRegister()" style="background: var(--success); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                    📝 Регистрация
                </button>
            </div>
        </div>

        <div id="statusBar" class="status-bar">
            ✅ Сервер работает
        </div>

        <script>
            const API_URL = window.location.origin;
            let token = localStorage.getItem('token');

            async function login() {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const btn = document.getElementById('loginBtn');
                const text = document.getElementById('loginText');

                if (!email || !password) {
                    alert('Введите email и пароль');
                    return;
                }

                text.innerHTML = '<div class="loader"></div>Вход...';
                btn.disabled = true;

                try {
                    const response = await fetch(API_URL + '/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Ошибка входа');
                    }

                    token = data.token;
                    localStorage.setItem('token', token);

                    showDashboard(data.user);

                } catch (error) {
                    alert(error.message);
                } finally {
                    text.textContent = '🔐 Войти в систему';
                    btn.disabled = false;
                }
            }

            function showDashboard(user) {
                document.body.innerHTML = \`
                    <div style="width: 100%; max-width: 1200px; background: white; border-radius: 15px; padding: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                            <div>
                                <h1 style="color: var(--primary);">Добро пожаловать, \${user.name}!</h1>
                                <p style="color: var(--text-secondary);">\${getRoleDisplay(user.role)}</p>
                            </div>
                            <button onclick="logout()" style="background: var(--danger); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                                Выйти
                            </button>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                            <div style="background: var(--light); padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 40px; margin-bottom: 10px;">📚</div>
                                <div style="font-size: 32px; font-weight: bold; color: var(--primary);">
                                    \${user.learningStats.enrolledCourses.length}
                                </div>
                                <div style="color: var(--text-secondary);">Мои курсы</div>
                            </div>

                            <div style="background: var(--light); padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 40px; margin-bottom: 10px;">⏱️</div>
                                <div style="font-size: 32px; font-weight: bold; color: var(--primary);">
                                    \${user.learningStats.totalHours}ч
                                </div>
                                <div style="color: var(--text-secondary);">Часы обучения</div>
                            </div>

                            <div style="background: var(--light); padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                                <div style="font-size: 32px; font-weight: bold; color: var(--primary);">
                                    \${user.learningStats.completedCourses.length}
                                </div>
                                <div style="color: var(--text-secondary);">Пройдено курсов</div>
                            </div>
                        </div>

                        <div style="margin-top: 30px; padding: 20px; background: var(--light); border-radius: 10px;">
                            <h3>📊 Информация о системе</h3>
                            <div id="statsInfo" style="margin-top: 10px;">Загрузка...</div>
                        </div>
                    </div>

                    <div id="statusBar" class="status-bar">
                        ✅ Вошли как: \${user.name}
                    </div>
                \`;

                loadStats();
            }

            async function loadStats() {
                try {
                    const response = await fetch(API_URL + '/api/stats');
                    const stats = await response.json();
                    
                    document.getElementById('statsInfo').innerHTML = \`
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                            <div style="padding: 10px; background: white; border-radius: 6px;">
                                <strong>👥 Пользователей:</strong> \${stats.totalUsers}
                            </div>
                            <div style="padding: 10px; background: white; border-radius: 6px;">
                                <strong>📚 Курсов:</strong> \${stats.totalCourses}
                            </div>
                            <div style="padding: 10px; background: white; border-radius: 6px;">
                                <strong>🎫 Обращений:</strong> \${stats.totalTickets}
                            </div>
                            <div style="padding: 10px; background: white; border-radius: 6px;">
                                <strong>⏱️ Часов обучения:</strong> \${stats.totalLearningHours}ч
                            </div>
                        </div>
                    \`;
                } catch (error) {
                    console.error('Ошибка:', error);
                }
            }

            function logout() {
                localStorage.removeItem('token');
                location.reload();
            }

            function fillLogin(email, password) {
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
            }

            function getRoleDisplay(role) {
                const roles = {
                    'administrator': '👑 Администратор',
                    'user': '🎓 Пользователь'
                };
                return roles[role] || role;
            }

            function showRegister() {
                document.body.innerHTML = \`
                    <div class="container">
                        <div class="header">
                            <h1 class="title">Регистрация</h1>
                            <p class="subtitle">Создайте новую учетную запись</p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Имя</label>
                            <input type="text" id="regName" class="form-input" placeholder="Ваше имя">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="regEmail" class="form-input" placeholder="example@mail.ru">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Пароль</label>
                            <input type="password" id="regPassword" class="form-input" placeholder="Минимум 6 символов">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Подтверждение пароля</label>
                            <input type="password" id="regConfirm" class="form-input" placeholder="Повторите пароль">
                        </div>

                        <button class="btn" onclick="register()">
                            📝 Зарегистрироваться
                        </button>

                        <div style="margin-top: 20px; text-align: center;">
                            <button onclick="location.reload()" style="background: var(--text-secondary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                                ← Назад к входу
                            </button>
                        </div>
                    </div>
                \`;
            }

            async function register() {
                const name = document.getElementById('regName').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                const confirm = document.getElementById('regConfirm').value;

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

                try {
                    const response = await fetch(API_URL + '/api/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            name, 
                            email, 
                            password,
                            role: 'user'
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Ошибка регистрации');
                    }

                    alert('Регистрация успешна! Теперь войдите в систему.');
                    location.reload();

                } catch (error) {
                    alert(error.message);
                }
            }

            // Проверка токена при загрузке
            if (token) {
                checkToken();
            }

            async function checkToken() {
                try {
                    const response = await fetch(API_URL + '/api/profile', {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });

                    if (response.ok) {
                        const user = await response.json();
                        showDashboard(user);
                    }
                } catch (error) {
                    localStorage.removeItem('token');
                }
            }

            // Обработчик Enter
            document.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    if (document.getElementById('password')) {
                        login();
                    } else if (document.getElementById('regConfirm')) {
                        register();
                    }
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API маршруты
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: db.users.length + 1,
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
      registrationDate: new Date().toISOString(),
      learningStats: {
        totalHours: 0,
        completedCourses: [],
        testResults: [],
        enrolledCourses: []
      }
    };
    
    db.users.push(newUser);
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        learningStats: newUser.learningStats
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        learningStats: user.learningStats
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

app.get('/api/profile', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    learningStats: user.learningStats
  });
});

app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: db.users.length,
    totalCourses: db.courses.length,
    totalTickets: db.tickets.length,
    totalLearningHours: db.users.reduce((sum, user) => sum + (user.learningStats?.totalHours || 0), 0)
  };
  
  res.json(stats);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
});