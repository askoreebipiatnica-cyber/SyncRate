import express, { Request, Response, NextFunction } from 'express';
import licenseRouter from './routes/license';
import webhookRouter from './routes/webhook';

const app = express();
const PORT = process.env.LICENSE_SERVER_PORT || 3001;

// Встроенный парсинг JSON-тел запросов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Встроенный Rate Limiter (ограничитель частоты запросов) для защиты от брутфорс-атак
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitInfo>();

// Очистка памяти от устаревших IP-лимитов раз в минуту
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of ipRateLimits.entries()) {
    if (now > info.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}, 60000);

const verifyRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Получаем реальный IP-адрес клиента с учетом прокси-серверов
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip || req.socket.remoteAddress || 'unknown').trim();
  
  const now = Date.now();
  const limitWindowMs = 60 * 1000; // Окно лимитирования - 1 минута
  const maxRequests = 5; // Максимум 5 запросов

  const clientLimit = ipRateLimits.get(ip);

  if (!clientLimit || now > clientLimit.resetTime) {
    // Если клиент обращается впервые или период лимита истек, создаем новую запись
    ipRateLimits.set(ip, {
      count: 1,
      resetTime: now + limitWindowMs
    });
    return next();
  }

  if (clientLimit.count >= maxRequests) {
    console.warn(`[Rate Limit] Заблокирован подозрительный запрос с IP: ${ip} на эндпоинт верификации.`);
    return res.status(429).json({
      success: false,
      error: 'Превышен лимит запросов. Разрешено не более 5 проверок в минуту. Пожалуйста, подождите.'
    });
  }

  // Увеличиваем счетчик и продолжаем выполнение
  clientLimit.count += 1;
  next();
};

// Применяем Rate Limiter специально к эндпоинту верификации лицензий
app.use('/api/license/verify', verifyRateLimiter);

// Подключаем маршруты для работы с лицензиями
app.use('/api/license', licenseRouter);

// Подключаем маршруты для вебхуков платежных систем
app.use('/api/webhook', webhookRouter);

// Базовый эндпоинт проверки статуса сервера (Healthcheck)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'License Server'
  });
});

// Глобальный обработчик непредвиденных ошибок Express
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Необработанное исключение приложения:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя критическая ошибка сервера'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`[License Server] Успешно запущен и слушает на http://localhost:${PORT}`);
  console.log(`[License Server] Доступные эндпоинты:`);
  console.log(` - POST http://localhost:${PORT}/api/license/generate (Генерация ключей)`);
  console.log(` - POST http://localhost:${PORT}/api/license/verify (Верификация с защитой от брутфорса)`);
  console.log(` - POST http://localhost:${PORT}/api/webhook/payanyway (Вебхук оплаты PayAnyWay)`);
  console.log(` - GET  http://localhost:${PORT}/health (Проверка жизнеспособности)`);
});
