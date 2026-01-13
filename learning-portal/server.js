const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'learning_portal_secret_key_2023_yk';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// API Routes

// 1. Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Проверка существования пользователя
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создание нового пользователя
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
    
    // Создание JWT токена
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
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

// 2. Вход
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Поиск пользователя
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Создание JWT токена
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

// 3. Получение профиля
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

// 4. Получение курсов
app.get('/api/courses', (req, res) => {
  res.json(db.courses);
});

// 5. Запись на курс
app.post('/api/courses/:id/enroll', authenticateToken, (req, res) => {
  const courseId = parseInt(req.params.id);
  const user = db.users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Курс не найден' });
  }
  
  if (!user.learningStats.enrolledCourses.includes(courseId)) {
    user.learningStats.enrolledCourses.push(courseId);
  }
  
  res.json({ enrolledCourses: user.learningStats.enrolledCourses });
});

// 6. Создание обращения
app.post('/api/tickets', authenticateToken, (req, res) => {
  const { subject, message, category, priority } = req.body;
  const user = db.users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const newTicket = {
    id: db.tickets.length + 1,
    subject,
    message,
    category,
    priority,
    status: 'open',
    userId: user.id,
    userName: user.name,
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 1,
        text: message,
        sender: user.name,
        timestamp: new Date().toISOString(),
        type: "user"
      }
    ]
  };
  
  db.tickets.push(newTicket);
  res.status(201).json(newTicket);
});

// 7. Статистика системы
app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: db.users.length,
    totalCourses: db.courses.length,
    totalTickets: db.tickets.length,
    activeTickets: db.tickets.filter(t => t.status === 'open').length,
    totalLearningHours: db.users.reduce((sum, user) => sum + (user.learningStats?.totalHours || 0), 0)
  };
  
  res.json(stats);
});

// 8. Проверка сервера
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Статические файлы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 База данных:`);
  console.log(`   👥 Пользователей: ${db.users.length}`);
  console.log(`   📚 Курсов: ${db.courses.length}`);
  console.log(`   🎫 Обращений: ${db.tickets.length}`);
  console.log(`\n📡 Доступные эндпоинты:`);
  console.log(`   POST /api/register - Регистрация`);
  console.log(`   POST /api/login - Вход`);
  console.log(`   GET  /api/profile - Профиль (требуется токен)`);
  console.log(`   GET  /api/courses - Все курсы`);
  console.log(`   GET  /api/health - Проверка сервера`);
});