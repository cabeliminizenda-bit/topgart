'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireAdmin } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// --- Client Actions ---

export async function submitReview(productId: string, rating: number, comment: string) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return { error: "Sie müssen angemeldet sein, um eine Bewertung abzugeben." };
  }

  if (!productId || !UUID_REGEX.test(productId)) {
    return { error: "Ungültige Produkt-ID." };
  }

  const intRating = Number(rating);
  if (!Number.isInteger(intRating) || intRating < 1 || intRating > 5) {
    return { error: "Die Bewertung muss eine ganze Zahl zwischen 1 und 5 sein." };
  }

  const cleanComment = String(comment || '').trim();
  if (cleanComment.length < 3 || cleanComment.length > 2000) {
    return { error: "Ihre Bewertung muss zwischen 3 und 2000 Zeichen lang sein." };
  }

  // Check product existence
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
    select: { id: true, slug: true },
  });
  if (!product) {
    return { error: "Produkt nicht gefunden." };
  }

  // Prevent spamming multiple reviews on the same product within 1 hour
  const recentReview = await prisma.review.findFirst({
    where: {
      productId,
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 3600_000) },
    },
  });
  if (recentReview) {
    return { error: "Sie haben kürzlich bereits eine Bewertung für dieses Produkt abgegeben." };
  }

  try {
    const reviewerName = user.email ? user.email.split('@')[0] : 'Kunde';

    await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        reviewerName,
        rating: intRating,
        comment: cleanComment,
        isApproved: false // Requires admin moderation by default
      }
    });

    revalidatePath(`/produkt/[slug]`, 'page');
    revalidatePath(`/product/[slug]`, 'page');
    revalidatePath(`/account/reviews`);

    return { success: true };
  } catch (error) {
    console.error("Fehler beim Speichern der Bewertung:", error);
    return { error: "Beim Speichern Ihrer Bewertung ist ein Fehler aufgetreten." };
  }
}

// --- Admin Actions ---

export async function toggleReviewApproval(reviewId: string, isApproved: boolean) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return;

  await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: Boolean(isApproved) }
  });

  revalidatePath('/admin/reviews');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/product/[slug]`, 'page');
}

export async function updateReview(reviewId: string, rating: number, comment: string, createdAtStr: string) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return;

  const intRating = Math.min(Math.max(1, Math.round(Number(rating) || 5)), 5);

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: intRating,
      comment: String(comment || '').trim().slice(0, 5000),
      createdAt: new Date(createdAtStr)
    }
  });

  revalidatePath('/admin/reviews');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/product/[slug]`, 'page');
}

export async function deleteReview(reviewId: string) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return;

  await prisma.review.delete({
    where: { id: reviewId }
  });

  revalidatePath('/admin/reviews');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/product/[slug]`, 'page');
}
