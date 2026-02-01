'use server'

import { auth, currentUser } from "@clerk/nextjs/server"
import { CreateSupabaseClient, CreateSupabaseServiceClient } from "../supabase";
import { DUMMY_COMPANIONS } from "../../constants/index";

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    const supabase = CreateSupabaseClient();

    const { data, error } = await supabase
    .from('companions')
    .insert({...formData, author})
    .select()

    if(error || !data) throw new Error(error?.message || "Failed to create a companion");

    return data[0];
}

export const getAllCompanions = async ({ limit= 10, page= 1, subject, topic }: GetAllCompanions) => {
    const { userId } = await auth();
    const supabase = CreateSupabaseClient();

    // If user is not logged in, return dummy data
    if (!userId) {
        let filteredDummies = [...DUMMY_COMPANIONS];
        
        // Apply filters to dummy data
        if (subject) {
            filteredDummies = filteredDummies.filter(c => 
                c.subject.toLowerCase().includes(subject.toLowerCase())
            );
        }
        if (topic) {
            filteredDummies = filteredDummies.filter(c => 
                c.topic.toLowerCase().includes(topic.toLowerCase()) ||
                c.name.toLowerCase().includes(topic.toLowerCase())
            );
        }
        
        return filteredDummies.slice(0, limit);
    }

    // Check if user has any companions
    const { data: userCompanions } = await supabase
        .from('companions')
        .select('id')
        .eq('author', userId)
        .limit(1);

    // If user has no companions, show dummy data
    if (!userCompanions || userCompanions.length === 0) {
        let filteredDummies = [...DUMMY_COMPANIONS];
        
        // Apply filters to dummy data
        if (subject) {
            filteredDummies = filteredDummies.filter(c => 
                c.subject.toLowerCase().includes(subject.toLowerCase())
            );
        }
        if (topic) {
            filteredDummies = filteredDummies.filter(c => 
                c.topic.toLowerCase().includes(topic.toLowerCase()) ||
                c.name.toLowerCase().includes(topic.toLowerCase())
            );
        }
        
        return filteredDummies.slice(0, limit);
    }

    // User has companions, fetch real data
    let query = supabase.from('companions').select();

    if(subject && topic) {
        query = query.ilike("subject", `%${subject}%`)
        .or(`topic.ilike.%${topic}%, name.ilike.%${topic}%`)
    } else if (subject) {
        query = query.ilike("subject", `%${subject}%`)
    } else if (topic) {
        query = query.or(`topic.ilike.%${topic}%, name.ilike.%${topic}%`)
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const {data: companions, error} = await query;

    if(error) throw new Error(error.message)
    
    return companions;
}

export const getCompanion = async (id: string) => {
    const supabase = CreateSupabaseClient();

    // Check if it's a dummy companion
    if (id.startsWith('dummy-')) {
        const dummyCompanion = DUMMY_COMPANIONS.find(c => c.id === id);
        return dummyCompanion || null;
    }

    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id)

    if(error) {
        console.log(error);
        return null;
    }
    
    return data[0];
} 

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    
    // Don't save dummy companions to session history
    if (companionId.startsWith('dummy-')) {
        return null;
    }

    const supabase = CreateSupabaseClient();
    const {data, error} = await supabase.from('session_history').insert({
        companion_id: companionId,
        user_id: userId
    })

    if(error) throw new Error(error.message);

    return data;
}

export const getRecentSession = async (limit = 10) => {
    const supabase = CreateSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companion:companion_id (*)`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companion }) => companion);
}

export const getRecentSessionsForHome = async (limit = 3) => {
    const { userId } = await auth();
    
    // If not logged in, return empty array
    if (!userId) return [];
    
    const supabase = CreateSupabaseClient();
    
    // First check if user has any companions
    const { data: userCompanions } = await supabase
        .from('companions')
        .select('id')
        .eq('author', userId)
        .limit(1);

    // If user has no companions, return empty array
    if (!userCompanions || userCompanions.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('session_history')
        .select(`companion:companion_id (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companion }) => companion);
}

export const getUserSessions = async (userId: string, limit = 10) => {
    const supabase = CreateSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companion:companion_id (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companion }) => companion);
}

export const getUserCompanion = async (userId: string) => {
    const supabase = CreateSupabaseClient();
    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('author', userId)

    if(error) throw new Error(error.message);

    return data;
}

export const NewCompanionPermissions = async () => {
    const { userId, has } = await auth()
    
    if (!userId) return false;
    
    const supabase = CreateSupabaseClient()

    let limit = 0

    if(has({ plan: 'pro' })) {
        return true
    } else if(has({feature: '3_companion_limit'})) {
        limit = 3;
    } else if(has({feature: "10_companion_limit"})) {
        limit = 10
    } else {
        // Default free tier
        limit = 3;
    }

    const { data, error } = await supabase
        .from('companions')
        .select('id', {count: 'exact'})
        .eq('author', userId)

    if(error) throw new Error(error.message)

    const companionCount = data?.length || 0;

    return companionCount < limit;
}

// Check if user has permission to save conversation history 
//  Only available for Intermediate Learner and Pro Companion plans

export const hasConversationHistoryPermission = async () => {
   const { userId, has } = await auth();
   const user = await currentUser();
   
   if (!userId || !user) return false;
   
   // Check for paid plans
   if (has({ plan: 'pro' }) || has({ plan: 'intermediate' })) {
       return true;
   }
   
   return false;
}

// Save or update conversation history
export const saveConversationHistory = async (
    companionId: string, 
    messages: ConversationMessage[]
) => {
    const { userId } = await auth();
    
    if (!userId) throw new Error('User not authenticated');
    
    const hasPermission = await hasConversationHistoryPermission();
    if (!hasPermission) {
        throw new Error('Conversation history is only available for Intermediate and Pro plans');
    }
    
    // Use service role client - bypasses RLS
    const supabase = CreateSupabaseServiceClient();
    
    const { data: existingConversation } = await supabase
        .from('conversation_history')
        .select('id')
        .eq('user_id', userId)
        .eq('companion_id', companionId)
        .maybeSingle();
    
    if (existingConversation) {
        const { data, error } = await supabase
            .from('conversation_history')
            .update({
                messages: messages,
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', existingConversation.id)
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from('conversation_history')
            .insert({
                user_id: userId,
                companion_id: companionId,
                messages: messages,
                last_message_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }
}

// Get conversation history for a specific companion
export const getConversationHistory = async (companionId: string) => {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            console.log('No userId found');
            return null;
        }
        
        // Check permission
        const hasPermission = await hasConversationHistoryPermission();
        if (!hasPermission) {
            console.log('No permission for conversation history');
            return null;
        }
        
        const supabase = CreateSupabaseServiceClient();
        
        const { data, error } = await supabase
            .from('conversation_history')
            .select('*')
            .eq('user_id', userId)
            .eq('companion_id', companionId)
            .maybeSingle(); // Use maybeSingle instead of single
        
        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        
        console.log('Found conversation history:', data);
        return data;
    } catch (error) {
        console.error('Error in getConversationHistory:', error);
        return null;
    }
}

// Delete conversation history
export const deleteConversationHistory = async (companionId: string) => {
    const { userId } = await auth();
    
    if (!userId) throw new Error('User not authenticated');
    
    const supabase = CreateSupabaseClient();
    
    const { error } = await supabase
        .from('conversation_history')
        .delete()
        .eq('user_id', userId)
        .eq('companion_id', companionId);
    
    if (error) throw new Error(error.message);
    
    return { success: true };
}

// Get all conversation histories for user
export const getAllConversationHistories = async () => {
    const { userId } = await auth();
    
    if (!userId) return [];
    
    const hasPermission = await hasConversationHistoryPermission();
    if (!hasPermission) return [];
    
    const supabase = CreateSupabaseServiceClient();
    
    const { data, error } = await supabase
        .from('conversation_history')
        .select(`
            *,
            companions!conversation_history_companion_id_fkey (*)
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(error.message);
    }

    // Rename 'companions' to 'companion' for consistency
    return data.map(conv => ({
        ...conv,
        companion: conv.companions,
        companions: undefined
    }));
}