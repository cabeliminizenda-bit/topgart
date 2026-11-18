'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ARTICLES
export async function getArticles(publishedOnly = false) {
  if (!publishedOnly) {
    await requireAdmin();
  }
  return await prisma.article.findMany({
    where: publishedOnly ? { isPublished: true } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { comments: true }
      }
    }
  });
}

export async function getDistinctBlogCategories(): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: { category: { not: null }, isPublished: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' }
  });
  return articles.map(a => a.category).filter(Boolean) as string[];
}

export async function getDistinctBlogAuthors(): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: { authorName: { not: null }, isPublished: true },
    select: { authorName: true },
    distinct: ['authorName'],
    orderBy: { authorName: 'asc' }
  });
  return articles.map(a => a.authorName).filter(Boolean) as string[];
}

export async function getArticleBySlug(slug: string) {
  if (!slug || typeof slug !== 'string') return null;

  let isAdmin = false;
  try {
    await requireAdmin();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!article) return null;
  // Unpublished drafts must only be accessible to logged-in admins
  if (!article.isPublished && !isAdmin) return null;

  return article;
}

export async function getArticleById(id: string) {
  await requireAdmin();
  if (!id || !UUID_REGEX.test(id)) return null;
  return await prisma.article.findUnique({
    where: { id }
  });
}

export async function createArticle(data: any) {
  await requireAdmin();
  try {
    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        category: data.category,
        authorName: data.authorName,
        isPublished: data.isPublished,
        tags: data.tags || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null
      }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    return { success: true, article };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateArticle(id: string, data: any) {
  await requireAdmin();
  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        category: data.category,
        authorName: data.authorName,
        isPublished: data.isPublished,
        tags: data.tags || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null
      }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    return { success: true, article };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  try {
    await prisma.article.delete({
      where: { id }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function quickEditArticle(id: string, data: { title: string, slug: string, category: string, isPublished: boolean, createdAt: string }) {
  await requireAdmin();
  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        category: data.category,
        isPublished: data.isPublished,
        createdAt: new Date(data.createdAt),
      }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: "Fehler bei der Schnellbearbeitung. Bitte prüfen Sie, ob der Slug eindeutig ist." };
  }
}

// COMMENTS
export async function addComment(articleId: string, data: any) {
  try {
    if (!articleId || !UUID_REGEX.test(articleId)) {
      return { error: 'Ungültige Artikel-ID.' };
    }

    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`comment_${ip}`, 5, 600); // 5 comments per 10 mins
    if (!rateLimit.success) {
      return { error: 'Zu viele Kommentare gesendet. Bitte warten Sie einige Minuten.' };
    }

    const author = String(data?.author || '').trim();
    const email = String(data?.email || '').trim().toLowerCase();
    const content = String(data?.content || '').trim();

    if (!author || author.length < 2 || author.length > 80) {
      return { error: 'Der Name muss zwischen 2 und 80 Zeichen lang sein.' };
    }

    if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
      return { error: 'Ungültige E-Mail-Adresse.' };
    }

    if (!content || content.length < 3 || content.length > 2000) {
      return { error: 'Der Kommentar muss zwischen 3 und 2000 Zeichen lang sein.' };
    }

    // Verify article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, slug: true, isPublished: true },
    });

    if (!article || !article.isPublished) {
      return { error: 'Artikel nicht gefunden.' };
    }

    await prisma.articleComment.create({
      data: {
        articleId,
        author,
        email,
        content,
        isApproved: false // Requires admin moderation
      }
    });

    revalidatePath(`/blog/${article.slug}`);
    return { success: true };
  } catch (error: any) {
    console.error('Comment submission error:', error);
    return { error: 'Beim Senden Ihres Kommentars ist ein Fehler aufgetreten.' };
  }
}

export async function getRecentComments(take = 5) {
  const safeTake = Math.min(Math.max(1, Number(take) || 5), 20);
  return await prisma.articleComment.findMany({
    where: { isApproved: true },
    take: safeTake,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      author: true,
      createdAt: true,
      article: {
        select: { slug: true, title: true }
      }
    }
  });
}
