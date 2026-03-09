export type OrderStatus =
    | 'placed'
    | 'confirmed'
    | 'preparing'
    | 'picked_up'
    | 'on_the_way'
    | 'delivered'
    | 'cancelled';

export type UserRole = 'customer' | 'driver';

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string;
                    phone: string | null;
                    avatar_url: string | null;
                    role: UserRole;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name: string;
                    phone?: string | null;
                    avatar_url?: string | null;
                    role: UserRole;
                    created_at?: string;
                };
                Update: {
                    full_name?: string;
                    phone?: string | null;
                    avatar_url?: string | null;
                    role?: UserRole;
                };
            };
            restaurants: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    image_url: string | null;
                    category: string;
                    rating: number;
                    delivery_time: number;
                    lat: number;
                    lng: number;
                    address: string;
                    is_open: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    image_url?: string | null;
                    category: string;
                    rating?: number;
                    delivery_time: number;
                    lat: number;
                    lng: number;
                    address: string;
                    is_open?: boolean;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    image_url?: string | null;
                    category?: string;
                    rating?: number;
                    delivery_time?: number;
                    lat?: number;
                    lng?: number;
                    address?: string;
                    is_open?: boolean;
                };
            };
            menu_categories: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    name: string;
                    order_index: number;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    name: string;
                    order_index?: number;
                };
                Update: {
                    name?: string;
                    order_index?: number;
                };
            };
            menu_items: {
                Row: {
                    id: string;
                    category_id: string;
                    restaurant_id: string;
                    name: string;
                    description: string | null;
                    price: number;
                    image_url: string | null;
                    is_available: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    category_id: string;
                    restaurant_id: string;
                    name: string;
                    description?: string | null;
                    price: number;
                    image_url?: string | null;
                    is_available?: boolean;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    price?: number;
                    image_url?: string | null;
                    is_available?: boolean;
                };
            };
            orders: {
                Row: {
                    id: string;
                    customer_id: string;
                    driver_id: string | null;
                    restaurant_id: string;
                    status: OrderStatus;
                    total_amount: number;
                    delivery_fee: number;
                    delivery_address: string;
                    delivery_lat: number;
                    delivery_lng: number;
                    payment_reference: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    customer_id: string;
                    driver_id?: string | null;
                    restaurant_id: string;
                    status?: OrderStatus;
                    total_amount: number;
                    delivery_fee: number;
                    delivery_address: string;
                    delivery_lat: number;
                    delivery_lng: number;
                    payment_reference?: string | null;
                };
                Update: {
                    driver_id?: string | null;
                    status?: OrderStatus;
                    payment_reference?: string | null;
                    updated_at?: string;
                };
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    menu_item_id: string;
                    quantity: number;
                    unit_price: number;
                };
                Insert: {
                    id?: string;
                    order_id: string;
                    menu_item_id: string;
                    quantity: number;
                    unit_price: number;
                };
                Update: {
                    quantity?: number;
                };
            };
            driver_locations: {
                Row: {
                    id: string;
                    driver_id: string;
                    lat: number;
                    lng: number;
                    is_online: boolean;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    driver_id: string;
                    lat: number;
                    lng: number;
                    is_online?: boolean;
                };
                Update: {
                    lat?: number;
                    lng?: number;
                    is_online?: boolean;
                    updated_at?: string;
                };
            };
        };
    };
}


// Add this at the bottom of database.types.ts
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];