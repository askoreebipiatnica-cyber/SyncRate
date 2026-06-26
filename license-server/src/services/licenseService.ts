import * as crypto from 'crypto';
import { generateKey, hashKey } from '../utils/crypto';
import { saveLicense } from './db';

/**
 * Сервис для управления жизненным циклом лицензий.
 */
export class LicenseService {
  /**
   * Выпускает новую лицензию для указанного уровня (tier) и привязывает её к транзакции.
   * @param tier Уровень лицензии ('PRO' или 'PLUS')
   * @param transactionId ID транзакции из платежной системы (для истории и аудита)
   * @returns Сгенерированный открытый лицензионный ключ
   */
  static async issueLicense(tier: string, transactionId: string): Promise<string> {
    const cleanTier = tier.trim().toUpperCase();
    if (cleanTier !== 'PRO' && cleanTier !== 'PLUS') {
      throw new Error(`Недопустимый уровень лицензии для выпуска: ${tier}`);
    }

    // 1. Генерируем уникальный лицензионный ключ
    const licenseKey = generateKey(cleanTier);

    // 2. Хешируем ключ для надежного хранения (salt + PBKDF2 hash)
    const keyHash = hashKey(licenseKey);

    // 3. Вычисляем SHA-256 от открытого ключа для использования в качестве безопасного Doc ID в БД
    const keyId = crypto.createHash('sha256').update(licenseKey).digest('hex');

    // 4. Сохраняем в базу данных
    await saveLicense(keyId, keyHash, cleanTier);

    console.log(`[LicenseService] Успешно выпущена лицензия ${cleanTier} для транзакции ${transactionId}. Безопасный ID: ${keyId}`);

    // Возвращаем ключ в открытом виде, чтобы его можно было отправить клиенту
    return licenseKey;
  }
}
