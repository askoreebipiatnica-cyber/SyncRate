import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { generateKey, hashKey, verifyKey } from '../utils/crypto';
import { saveLicense, findLicense, activateLicense } from '../services/db';

const router = Router();

/**
 * Вспомогательная функция для генерации безопасного ID документа на основе SHA-256 хэша ключа.
 * Это позволяет осуществлять поиск O(1) в БД без хранения ключа в открытом виде.
 */
function getLicenseDocId(key: string): string {
  return crypto.createHash('sha256').update(key.trim().toUpperCase()).digest('hex');
}

/**
 * POST /api/license/generate
 * Генерирует новый лицензионный ключ для указанного уровня (tier),
 * хеширует его и сохраняет в БД. Возвращает сгенерированный ключ покупателю в ответе (только один раз при создании!).
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    
    if (!tier || typeof tier !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Параметр "tier" обязателен и должен быть строкой (например, PRO или PLUS)'
      });
    }

    const cleanTier = tier.trim().toUpperCase();
    if (cleanTier !== 'PRO' && cleanTier !== 'PLUS') {
      return res.status(400).json({
        success: false,
        error: 'Неверный уровень лицензии. Допустимые значения: PRO, PLUS'
      });
    }

    // 1. Генерируем уникальный ключ
    const licenseKey = generateKey(cleanTier);

    // 2. Хешируем ключ для безопасного хранения (salt + hash)
    const keyHash = hashKey(licenseKey);

    // 3. Вычисляем SHA-256 от открытого ключа для использования в качестве первичного ключа (Doc ID)
    const keyId = getLicenseDocId(licenseKey);

    // 4. Сохраняем в БД
    await saveLicense(keyId, keyHash, cleanTier);

    // Возвращаем ключ пользователю. Внимание: в реальном production-приложении этот ключ
    // отправляется покупателю по email и больше никогда не отображается в админ-панели.
    return res.status(201).json({
      success: true,
      message: 'Лицензионный ключ успешно сгенерирован и сохранен',
      licenseKey, // Открытый ключ возвращается ТОЛЬКО один раз при генерации
      tier: cleanTier
    });
  } catch (error: any) {
    console.error('Ошибка при генерации лицензии:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера при создании лицензии'
    });
  }
});

/**
 * POST /api/license/verify
 * Верифицирует введенный лицензионный ключ.
 * Включает строгую санитизацию/валидацию регулярными выражениями для предотвращения SQL/NoSQL инъекций и XSS.
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey || typeof licenseKey !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Лицензионный ключ не передан'
      });
    }

    const formattedKey = licenseKey.trim().toUpperCase();

    // Санитизация и строгая валидация формата ключа регулярным выражением:
    // Допускаются только ключи формата PRO-XXXXXXXX или PLUS-XXXXXXXX,
    // где X - латинские буквы и цифры от 6 до 12 символов. Любые другие символы (включая кавычки, скобки и т.д.) отвергаются на корневом уровне.
    const keyRegex = /^(PRO|PLUS)-[A-Z0-9]{6,12}$/;
    if (!keyRegex.test(formattedKey)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат лицензионного ключа. Ожидается: TIER-XXXXXXXX'
      });
    }

    // 1. Получаем безопасный ID по SHA-256 от ключа
    const keyId = getLicenseDocId(formattedKey);

    // 2. Ищем запись в нашей БД по безопасному ID
    const license = await findLicense(keyId);
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Лицензионный ключ не найден в базе данных'
      });
    }

    // 3. Сверяем введенный ключ с соленым PBKDF2 хешем из базы данных
    const isValid = verifyKey(formattedKey, license.hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный лицензионный ключ'
      });
    }

    // 4. Если ключ верный, активируем его (если он еще не был активирован)
    if (!license.isUsed) {
      await activateLicense(keyId);
    }

    return res.json({
      success: true,
      message: 'Лицензия успешно верифицирована',
      tier: license.tier,
      activatedAt: license.activatedAt || new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ошибка при верификации лицензии:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера при верификации'
    });
  }
});

export default router;
