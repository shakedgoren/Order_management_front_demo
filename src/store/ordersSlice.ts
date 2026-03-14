import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api';
import { Order, OrdersState, OrderItem } from '../types';

export const fetchOrders = createAsyncThunk<Order[], number>(
  'orders/fetch',
  async (shabbatId, { rejectWithValue }) => {
    try {
      const r = await api.get(`/orders/${shabbatId}/by-shabbat/`);
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה');
    }
  }
);

export const createOrder = createAsyncThunk<Order, Record<string, unknown>>(
  'orders/create',
  async (data, { rejectWithValue }) => {
    try {
      const r = await api.post('/orders/', data);
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה ביצירת הזמנה');
    }
  }
);

export const updateOrder = createAsyncThunk<Order, { orderId: number; data: Record<string, unknown> }>(
  'orders/update',
  async ({ orderId, data }, { rejectWithValue }) => {
    try {
      const r = await api.put(`/orders/${orderId}/`, data);
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה בעדכון הזמנה');
    }
  }
);

export const updateOrderStatus = createAsyncThunk<Order, { orderId: number; status: string }>(
  'orders/updateStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const r = await api.put(`/orders/${orderId}/status/`, { status });
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה בעדכון סטטוס');
    }
  }
);

export const deleteOrder = createAsyncThunk<{ orderId: number }, { orderId: number; shabbatId: number }>(
  'orders/delete',
  async ({ orderId }, { rejectWithValue }) => {
    try {
      await api.delete(`/orders/${orderId}/delete/`);
      return { orderId };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה במחיקת הזמנה');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { list: [], loading: false, error: null, lastLocalAction: 0 } as OrdersState,
  reducers: {
    clearOrders(state) { state.list = []; },
    optimisticUpdateOrder(
      state,
      action: PayloadAction<{ orderId: number; items: OrderItem[]; totalPrice: number }>
    ) {
      const { orderId, items, totalPrice } = action.payload;
      const idx = state.list.findIndex((o) => o.id === orderId);
      if (idx >= 0) {
        state.list[idx] = { ...state.list[idx], items, total_price: totalPrice };
      }
      state.lastLocalAction = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrders.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createOrder.fulfilled, (state, action) => {
        const idx = state.list.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
        else state.list.push(action.payload);
        state.lastLocalAction = Date.now();
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const idx = state.list.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
        state.lastLocalAction = Date.now();
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
        state.lastLocalAction = Date.now();
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.list = state.list.filter((o) => o.id !== action.payload.orderId);
        state.lastLocalAction = Date.now();
      });
  },
});

export const { clearOrders, optimisticUpdateOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
