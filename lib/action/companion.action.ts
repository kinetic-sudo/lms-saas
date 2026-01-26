'use server'

import { auth } from "@clerk/nextjs/server"
import { CreateSupabaseClient } from "../supabase";

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