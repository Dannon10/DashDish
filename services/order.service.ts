import { supabase } from './supabase';
import { Order, OrderWithItems } from '../types/order.types';

// Create a new order
export const createOrder = async (orderData: {
  customer_id: string;
  restaurant_id: string;
  items: { menu_item_id: string; quantity: number; unit_price: number }[];
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  payment_reference: string;
}): Promise<{ orderId: string | null; error: string | null }> => {
  // Step 1 — create the order row
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: orderData.customer_id,
      restaurant_id: orderData.restaurant_id,
      total_amount: orderData.total_amount,
      delivery_fee: orderData.delivery_fee,
      delivery_address: orderData.delivery_address,
      delivery_lat: orderData.delivery_lat,
      delivery_lng: orderData.delivery_lng,
      payment_reference: orderData.payment_reference,
      status: 'placed',
    })
    .select('id')
    .single();

  if (orderError) return { orderId: null, error: orderError.message };

  // Step 2 — insert all order items
  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) return { orderId: null, error: itemsError.message };

  return { orderId: order.id, error: null };
};

// Get order by ID with full details
export const getOrderById = async (
  orderId: string
): Promise<{ data: OrderWithItems | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*)
      ),
      restaurants (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as OrderWithItems, error: null };
};

// Get all orders for a customer
export const getCustomerOrders = async (
  customerId: string
): Promise<{ data: OrderWithItems[]; error: string | null }> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*)
      ),
      restaurants (*)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as OrderWithItems[], error: null };
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
  driverId?: string
): Promise<{ error: string | null }> => {
  const updates: any = { status };
  if (driverId) updates.driver_id = driverId;

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (error) return { error: error.message };
  return { error: null };
};