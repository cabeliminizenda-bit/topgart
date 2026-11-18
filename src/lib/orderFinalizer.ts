/* eslint-disable @typescript-eslint/no-explicit-any */

import prisma from '@/lib/prisma';
import { maskPII } from '@/lib/security';

/**
 * Internal server-only helper (NOT a 'use server' Server Action).
 * Finalizes an order after payment has been confirmed.
 * Includes an atomic idempotency guard so stock and emails are never processed twice.
 */
export async function finalizeOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order || !order.user) {
      console.error(`[finalizeOrder] Order ${orderId} or user not found`);
      return;
    }

    // SECURITY (M7): Atomic idempotency guard to prevent duplicate stock decrement or email spam
    let parsedMeta: Record<string, any> | null = null;
    if (order.destinationAddress) {
      try {
        const parsed = typeof order.destinationAddress === 'string'
          ? JSON.parse(order.destinationAddress)
          : order.destinationAddress;
        if (parsed && typeof parsed === 'object') {
          parsedMeta = parsed;
        }
      } catch {
        parsedMeta = null;
      }
    }

    if (parsedMeta?._finalizedAt) {
      console.warn(`[finalizeOrder] Order ${orderId} already finalized at ${parsedMeta._finalizedAt}. Skipping.`);
      return;
    }

    if (parsedMeta) {
      const claimMeta = { ...parsedMeta, _finalizedAt: new Date().toISOString() };
      const claimed = await prisma.order.updateMany({
        where: {
          id: orderId,
          NOT: { destinationAddress: { contains: '"_finalizedAt":' } },
        },
        data: { destinationAddress: JSON.stringify(claimMeta) },
      });
      if (claimed.count === 0) {
        console.warn(`[finalizeOrder] Concurrent finalization detected for order ${orderId}. Skipping.`);
        return;
      }
    } else {
      // Fallback idempotency check if destinationAddress is non-JSON or null
      const existingNotif = await prisma.notification.findFirst({
        where: { isAdmin: true, type: 'ORDER', link: `/admin/orders/${order.id}` },
        select: { id: true },
      });
      if (existingNotif) {
        console.warn(`[finalizeOrder] Order ${orderId} already has ORDER notification. Skipping.`);
        return;
      }
    }

    let userEmail = order.user.email;
    let customerName = 'Kunde';
    if (parsedMeta) {
      const billing = parsedMeta?.billing || parsedMeta?.shipping;
      if (billing) {
        if (billing.firstName) {
          customerName = `${billing.firstName} ${billing.lastName || ''}`.trim();
        }
        if (billing.email && typeof billing.email === 'string') {
          userEmail = billing.email.trim().toLowerCase();
        }
      }
    }

    // 1. Recover abandoned cart
    try {
      await prisma.abandonedCart.updateMany({
        where: { email: userEmail, status: 'ABANDONED' },
        data: {
          status: 'RECOVERED',
          recoveredOrderId: order.id,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      console.error('[finalizeOrder] Failed to mark abandoned cart as recovered', e);
    }

    // 2. Fetch settings for emails, currency, stock threshold
    const allSettings = await prisma.setting.findMany();
    const settingsMap = allSettings.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.value }),
      {} as Record<string, string>
    );
    const adminEmail =
      settingsMap['CONTACT_RECEIVER_EMAIL'] ||
      settingsMap['CONTACT_FORM_RECIPIENT'] ||
      process.env.ADMIN_EMAIL ||
      'info@hlghausgeraete.de';

    // 3. Send emails (awaited to ensure serverless completion)
    try {
      const { sendClientOrderConfirmation, sendAdminOrderNotification } = await import(
        '@/lib/mailer'
      );

      console.log(`[finalizeOrder] Sending order confirmation for order ${order.id} (client: ${maskPII(userEmail)})...`);
      const emailResults = await Promise.allSettled([
        sendClientOrderConfirmation(order, userEmail, customerName),
        sendAdminOrderNotification(order, adminEmail, {
          name: customerName,
          email: userEmail,
        })
      ]);
      console.log(`[finalizeOrder] Emails processed for order ${order.id}:`, emailResults.map(r => r.status));
    } catch (e) {
      console.error('[finalizeOrder] Email sending setup failed', e);
    }

    // 4. Stock decrement inside a Prisma interactive transaction (race-condition safe)
    try {
      const threshold = parseInt(settingsMap['LOW_STOCK_THRESHOLD'] || '5', 10);
      const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hlghausgeraete.de';
      const { sendLowStockAlertEmail } = await import('@/lib/mailer');

      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) continue;

          let currentStock: number | null = null;
          let variationName: string | null = null;

          if (item.variationId && product.variations) {
            const variations = product.variations as any[];
            const variationIndex = variations.findIndex(
              (v) => v.id === item.variationId
            );
            if (
              variationIndex !== -1 &&
              variations[variationIndex].stock !== null
            ) {
              variations[variationIndex].stock = Math.max(
                0,
                variations[variationIndex].stock - item.quantity
              );
              currentStock = variations[variationIndex].stock;
              variationName = Object.values(
                variations[variationIndex].attributes || {}
              ).join(', ');

              await tx.product.update({
                where: { id: product.id },
                data: { variations },
              });
            }
          } else if (product.stock !== null) {
            currentStock = Math.max(0, product.stock - item.quantity);
            await tx.product.update({
              where: { id: product.id },
              data: { stock: currentStock },
            });
          }

          // Send low stock alert (outside transaction, non-blocking)
          if (currentStock !== null && currentStock <= threshold) {
            sendLowStockAlertEmail(
              product.title,
              variationName,
              currentStock,
              threshold,
              adminEmail,
              storeUrl,
              product.id
            ).catch((e) =>
              console.error('[finalizeOrder] Low stock alert failed', e)
            );
          }
        }
      });
    } catch (stockErr) {
      console.error(
        '[finalizeOrder] Failed to decrement stock',
        stockErr
      );
    }

    // 5. In-app notification
    try {
      const { createNotification } = await import('@/lib/notifications');
      const { formatPriceNumber, defaultCurrencyOptions } = await import(
        '@/lib/formatPrice'
      );
      const currencyOptions = {
        currencySymbol:
          settingsMap.currencySymbol || defaultCurrencyOptions.currencySymbol,
        currencyPosition:
          (settingsMap.currencyPosition as any) ||
          defaultCurrencyOptions.currencyPosition,
        thousandSeparator:
          settingsMap.thousandSeparator !== undefined
            ? settingsMap.thousandSeparator
            : defaultCurrencyOptions.thousandSeparator,
        decimalSeparator:
          settingsMap.decimalSeparator ||
          defaultCurrencyOptions.decimalSeparator,
        taxIncludedInPrice: settingsMap.TAX_INCLUDED_IN_PRICE === 'true',
        defaultVatRate: Number(settingsMap.DEFAULT_VAT_RATE) || 20,
      };

      createNotification({
        isAdmin: true,
        type: 'ORDER',
        message: JSON.stringify({
          key: 'new_order_from',
          name: customerName,
          amount: formatPriceNumber(order.total, currencyOptions),
        }),
        link: `/admin/orders/${order.id}`,
      }).catch((e) =>
        console.error('[finalizeOrder] Notification failed', e)
      );
    } catch (e) {
      console.error('[finalizeOrder] Notification setup failed', e);
    }
  } catch (error) {
    console.error(`[finalizeOrder] Critical error for order ${orderId}:`, error);
  }
}
