import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { LicenseService } from '../services/licenseService';

const router = Router();

// Секретный ключ PayAnyWay (кодовое слово из настроек мерчанта)
const MNT_SECRET_KEY = process.env.PAYANYWAY_SECRET_KEY || 'test_secret_word';

/**
 * Вычисляет MD5 подпись для верификации входящего вебхука от PayAnyWay.
 * Формула: md5(MNT_ID + MNT_TRANSACTION_ID + MNT_OPERATION_ID + MNT_AMOUNT + MNT_CURRENCY + MNT_SUBSCRIBER_ID + MNT_TEST_MODE + MNT_SECRET_KEY)
 */
function calculateSignature(params: {
  MNT_ID?: string;
  MNT_TRANSACTION_ID?: string;
  MNT_OPERATION_ID?: string;
  MNT_AMOUNT?: string;
  MNT_CURRENCY?: string;
  MNT_SUBSCRIBER_ID?: string;
  MNT_TEST_MODE?: string;
}): string {
  const mntId = params.MNT_ID || '';
  const mntTransactionId = params.MNT_TRANSACTION_ID || '';
  const mntOperationId = params.MNT_OPERATION_ID || '';
  const mntAmount = params.MNT_AMOUNT || '';
  const mntCurrency = params.MNT_CURRENCY || '';
  const mntSubscriberId = params.MNT_SUBSCRIBER_ID || '';
  const mntTestMode = params.MNT_TEST_MODE || '';

  const signatureString = `${mntId}${mntTransactionId}${mntOperationId}${mntAmount}${mntCurrency}${mntSubscriberId}${mntTestMode}${MNT_SECRET_KEY}`;
  
  return crypto.createHash('md5').update(signatureString, 'utf8').digest('hex').toLowerCase();
}

/**
 * Вычисляет подпись для XML-ответа PayAnyWay.
 * Формула: md5(MNT_RESULT_CODE + MNT_ID + MNT_TRANSACTION_ID + MNT_SECRET_KEY)
 */
function calculateResponseSignature(resultCode: string, mntId: string, transactionId: string): string {
  const signatureString = `${resultCode}${mntId}${transactionId}${MNT_SECRET_KEY}`;
  return crypto.createHash('md5').update(signatureString, 'utf8').digest('hex').toLowerCase();
}

/**
 * POST /api/webhook/payanyway
 * Принимает POST-запрос с уведомлением о платеже от PayAnyWay.
 * Валидирует цифровую подпись (MD5) для защиты от подделки запросов.
 */
router.post('/payanyway', async (req: Request, res: Response) => {
  try {
    // Параметры могут приходить как в body (urlencoded/json), так и в query
    const params = { ...req.query, ...req.body };
    console.log('[PayAnyWay Webhook] Получен запрос:', params);

    const mntId = params.MNT_ID;
    const mntTransactionId = params.MNT_TRANSACTION_ID;
    const mntOperationId = params.MNT_OPERATION_ID;
    const mntAmount = params.MNT_AMOUNT;
    const mntCurrency = params.MNT_CURRENCY;
    const mntSubscriberId = params.MNT_SUBSCRIBER_ID;
    const mntTestMode = params.MNT_TEST_MODE;
    const incomingSignature = params.MNT_SIGNATURE;

    // 1. Проверяем наличие обязательных параметров
    if (!mntId || !mntTransactionId || !mntOperationId || !mntAmount || !incomingSignature) {
      console.error('[PayAnyWay Webhook] Отсутствуют обязательные параметры');
      return res.status(400).send('FAIL: Missing required parameters');
    }

    // 2. Рассчитываем эталонную подпись и сравниваем с пришедшей
    const expectedSignature = calculateSignature({
      MNT_ID: mntId,
      MNT_TRANSACTION_ID: mntTransactionId,
      MNT_OPERATION_ID: mntOperationId,
      MNT_AMOUNT: mntAmount,
      MNT_CURRENCY: mntCurrency,
      MNT_SUBSCRIBER_ID: mntSubscriberId,
      MNT_TEST_MODE: mntTestMode
    });

    if (incomingSignature.toLowerCase() !== expectedSignature) {
      console.error(`[PayAnyWay Webhook] Несовпадение цифровой подписи! Ожидалось: ${expectedSignature}, Получено: ${incomingSignature}`);
      return res.status(400).send('FAIL: Invalid signature');
    }

    // 3. Выпускаем лицензию
    // Пытаемся извлечь уровень лицензии (PRO или PLUS) из параметров.
    // Например, мы могли передать его в MNT_SUBSCRIBER_ID или custom_tier.
    let tier = 'PRO'; // По умолчанию
    if (mntSubscriberId && (mntSubscriberId.toUpperCase() === 'PRO' || mntSubscriberId.toUpperCase() === 'PLUS')) {
      tier = mntSubscriberId.toUpperCase();
    } else if (params.custom_tier && (params.custom_tier.toUpperCase() === 'PRO' || params.custom_tier.toUpperCase() === 'PLUS')) {
      tier = params.custom_tier.toUpperCase();
    }

    console.log(`[PayAnyWay Webhook] Подпись верна. Инициируем выпуск лицензии класса: ${tier} для транзакции: ${mntTransactionId}`);
    
    // Выпускаем лицензию и сохраняем её в БД
    const generatedLicenseKey = await LicenseService.issueLicense(tier, mntTransactionId);

    console.log(`[PayAnyWay Webhook] Лицензия успешно создана: ${generatedLicenseKey}`);

    // 4. Формируем успешный XML-ответ согласно спецификации PayAnyWay (Moneta.ru)
    const resultCode = '200';
    const responseSignature = calculateResponseSignature(resultCode, mntId, mntTransactionId);

    const xmlResponse = `<?xml version="1.0" encoding="UTF-8" ?>
<MNT_RESPONSE>
  <MNT_ID>${mntId}</MNT_ID>
  <MNT_TRANSACTION_ID>${mntTransactionId}</MNT_TRANSACTION_ID>
  <MNT_RESULT_CODE>${resultCode}</MNT_RESULT_CODE>
  <MNT_SIGNATURE>${responseSignature}</MNT_SIGNATURE>
</MNT_RESPONSE>`;

    // Отправляем XML-ответ с правильным Content-Type
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(xmlResponse);

  } catch (error: any) {
    console.error('[PayAnyWay Webhook] Критическая ошибка обработки вебхука:', error);
    return res.status(500).send('FAIL: Internal server error');
  }
});

export default router;
