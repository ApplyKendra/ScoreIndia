import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    maxQuantity: number;
}

interface CartState {
    items: CartItem[];
    deliveryType: 'PICKUP' | 'DELIVERY';
    deliveryAddress: string;
    deliveryPhone: string;
    instructions: string;

    addItem: (item: CartItem) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    setDeliveryType: (type: 'PICKUP' | 'DELIVERY') => void;
    setDeliveryAddress: (address: string) => void;
    setDeliveryPhone: (phone: string) => void;
    setInstructions: (instructions: string) => void;

    getSubtotal: () => number;
    getDeliveryFee: () => number;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            deliveryType: 'PICKUP',
            deliveryAddress: '',
            deliveryPhone: '',
            instructions: '',

            addItem: (item) =>
                set((state) => {
                    const existingItem = state.items.find((i) => i.itemId === item.itemId);

                    if (existingItem) {
                        const newQuantity = Math.min(
                            existingItem.quantity + item.quantity,
                            item.maxQuantity
                        );
                        return {
                            items: state.items.map((i) =>
                                i.itemId === item.itemId ? { ...i, quantity: newQuantity } : i
                            ),
                        };
                    }

                    return { items: [...state.items, item] };
                }),

            removeItem: (itemId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.itemId !== itemId),
                })),

            updateQuantity: (itemId, quantity) =>
                set((state) => ({
                    items: state.items.map((i) =>
                        i.itemId === itemId
                            ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
                            : i
                    ),
                })),

            clearCart: () =>
                set({
                    items: [],
                    deliveryAddress: '',
                    deliveryPhone: '',
                    instructions: '',
                }),

            setDeliveryType: (deliveryType) => set({ deliveryType }),
            setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
            setDeliveryPhone: (deliveryPhone) => set({ deliveryPhone }),
            setInstructions: (instructions) => set({ instructions }),

            getSubtotal: () => {
                const { items } = get();
                return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            },

            getDeliveryFee: () => {
                const { deliveryType } = get();
                return deliveryType === 'DELIVERY' ? 50 : 0;
            },

            getTotal: () => {
                return get().getSubtotal() + get().getDeliveryFee();
            },

            getItemCount: () => {
                const { items } = get();
                return items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);

export default useCartStore;
