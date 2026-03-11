import { supabase } from './supabase';
import { Restaurant, MenuCategoryWithItems } from '../types/restaurant.types';

// Get all restaurants
export const getRestaurants = async (): Promise<{
    data: Restaurant[];
    error: string | null;
}> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as Restaurant[], error: null };
};

// Get single restaurant with full menu
export const getRestaurantWithMenu = async (
    restaurantId: string
): Promise<{
    data: (Restaurant & { menu_categories: MenuCategoryWithItems[] }) | null;
    error: string | null;
}> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select(`
      *,
      menu_categories (
        *,
        menu_items (*)
      )
    `)
        .eq('id', restaurantId)
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as any, error: null };
};

// Search restaurants
export const searchRestaurants = async (
    query: string
): Promise<{
    data: Restaurant[];
    error: string | null;
}> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .order('rating', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as Restaurant[], error: null };
};