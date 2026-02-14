// lib/action/bookmark.action.ts
'use server'

import { auth } from '@clerk/nextjs/server';
import { CreateSupabaseServiceClient } from '../supabase';
import { revalidatePath } from 'next/cache';

export async function toggleBookmark(companionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const supabase = CreateSupabaseServiceClient();

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      revalidatePath('/');
      revalidatePath('/companion');
      
      return { success: true, bookmarked: false };
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          companion_id: companionId,
        });

      if (error) throw error;

      revalidatePath('/');
      revalidatePath('/companion');
      
      return { success: true, bookmarked: true };
    }
  } catch (error: any) {
    console.error('Error toggling bookmark:', error);
    return { success: false, error: error.message };
  }
}

export type BookmarkedCompanion = {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
  bookmarked_at: string;
};

export async function getBookmarkedCompanions(limit?: number): Promise<BookmarkedCompanion[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = CreateSupabaseServiceClient();

    let query = supabase
      .from('bookmarks')
      .select(`
        companion_id,
        created_at,
        companions:companion_id (
          id,
          name,
          subject,
          topic,
          duration
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Flatten: Supabase may return companions as object or array
    const rows: BookmarkedCompanion[] = [];
    for (const item of data ?? []) {
      const raw = (item as { companions: unknown }).companions;
      const companion = Array.isArray(raw) ? raw[0] : raw;
      if (companion && typeof companion === 'object' && 'id' in companion && 'name' in companion) {
        rows.push({
          id: String(companion.id),
          name: String(companion.name),
          subject: String(companion.subject),
          topic: String(companion.topic),
          duration: Number(companion.duration),
          bookmarked_at: item.created_at,
        });
      }
    }
    return rows;
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }
}

export async function isCompanionBookmarked(companionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const supabase = CreateSupabaseServiceClient();

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

export async function getUserBookmarkIds() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = CreateSupabaseServiceClient();

    const { data } = await supabase
      .from('bookmarks')
      .select('companion_id')
      .eq('user_id', userId);

    return data?.map(b => b.companion_id) || [];
  } catch (error) {
    return [];
  }
}