import { supabase } from './supabase';
import { Profile, UserRole } from '../types/auth.types';
import { TablesUpdate } from '../types/database.types';

// SIGN UP
export const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole
): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone,
                role,
            },
        },
    });

    if (error) return { error: error.message };
    return { error: null };
};

// SIGN IN
export const signIn = async (
    email: string,
    password: string
): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return { error: error.message };
    return { error: null };
};

// SIGN OUT
export const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
};

// GET PROFILE
export const getProfile = async (
    userId: string
): Promise<{ profile: Profile | null; error: string | null }> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return { profile: null, error: error.message };
    return { profile: data, error: null };
};

// UPDATE PROFILE
export const updateProfile = async (
    userId: string,
    updates: TablesUpdate<'profiles'>
): Promise<{ error: string | null }> => {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
};