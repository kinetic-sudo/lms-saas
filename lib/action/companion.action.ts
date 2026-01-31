'use server'

import { auth } from "@clerk/nextjs/server"
import { CreateSupabaseClient } from "../supabase";
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