import * as crypto from 'crypto';

/**
 * Генерирует уникальный лицензионный ключ установленного формата.
 * Формат: TIER-XXXXXX, где X - случайные прописные латинские буквы или цифры.
 * @param tier Уровень лицензии (например, 'PRO' или 'PLUS')
 * @returns Сгенерированный лицензионный ключ
 */
export function generateKey(tier: string): string {
  const cleanTier = tier.trim().toUpperCase();
  // Генерируем 8 случайных байт и преобразуем в base32/hex для получения буквенно-цифровой строки
  const randomChars = crypto.randomBytes(6)
    .toString('base64')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Оставляем только буквы и цифры
    .slice(0, 8); // Нам нужно ровно 8 символов для надежного ключа формата XXXXXXXX
  
  // Если после очистки спецсимволов длина меньше 8, дополняем случайными цифрами
  let finalChars = randomChars;
  while (finalChars.length < 8) {
    finalChars += Math.floor(Math.random() * 10).toString();
  }

  return `${cleanTier}-${finalChars}`;
}

/**
 * Хеширует лицензионный ключ с использованием соли и PBKDF2 (SHA256).
 * Это предотвращает утечку ключей в открытом виде при компрометации базы данных.
 * @param key Лицензионный ключ в открытом виде
 * @returns Хеш в формате iterations:salt:hash
 */
export function hashKey(key: string): string {
  const cleanKey = key.trim().toUpperCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 600000;
  const hash = crypto.pbkdf2Sync(cleanKey, salt, iterations, 64, 'sha256').toString('hex');
  return `${iterations}:${salt}:${hash}`;
}

/**
 * Проверяет соответствие введенного ключа сохраненному соленому хешу.
 * Защищена от атак по времени (Timing Attacks) с помощью timingSafeEqual.
 * @param key Введенный лицензионный ключ в открытом виде
 * @param storedHash Хеш из базы данных в формате iterations:salt:hash или salt:hash
 * @returns Результат проверки
 */
export function verifyKey(key: string, storedHash: string): boolean {
  try {
    const cleanKey = key.trim().toUpperCase();
    const parts = storedHash.split(':');
    let salt: string;
    let originalHash: string;
    let iterations = 1000;

    if (parts.length === 3) {
      iterations = parseInt(parts[0], 10);
      salt = parts[1];
      originalHash = parts[2];
    } else {
      salt = parts[0];
      originalHash = parts[1];
    }

    if (!salt || !originalHash) return false;

    const computedHash = crypto.pbkdf2Sync(cleanKey, salt, iterations, 64, 'sha256').toString('hex');
    
    // Безопасное сравнение во избежание атак по времени
    return crypto.timingSafeEqual(
      Buffer.from(originalHash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  } catch (error) {
    return false;
  }
}
