import { Database } from './database.types';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export interface MenuCategoryWithItems extends MenuCategory {
    menu_items: MenuItem[];
}

export interface RestaurantWithMenu extends Restaurant {
    menu_categories: MenuCategoryWithItems[];
}