import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export const  CreateSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            async accessToken() {
                return ((await auth()).getToken())
            }
        }
    )
}

export const  CreateSupabaseServiceClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
        {
           auth: {
            autoRefreshToken: false,
                persistSession: false
           }
        }
    )
}