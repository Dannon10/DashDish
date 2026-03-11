import { Database, OrderStatus } from './database.types';
import { MenuItem, Restaurant } from './restaurant.types';

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];

export interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

export interface OrderWithItems extends Order {
    order_items: (OrderItem & { menu_items: MenuItem })[];
    restaurants: Restaurant;
}

export { OrderStatus };