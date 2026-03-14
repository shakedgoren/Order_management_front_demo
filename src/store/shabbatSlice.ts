import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';
import { Shabbat, ShabbatState, ShabbatDetail } from '../types';

export const fetchCurrentShabbat = createAsyncThunk<Shabbat | null>(
  'shabbat/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const r = await api.get('/shabbat/current/');
      return r.data;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      return rejectWithValue(e.response?.data?.detail || 'שגיאה');
    }
  }
);

export const fetchAllShabbats = createAsyncThunk<Shabbat[]>(
  'shabbat/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const r = await api.get('/shabbat/');
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה');
    }
  }
);

export const fetchShabbatDetail = createAsyncThunk<ShabbatDetail, number>(
  'shabbat/fetchDetail',
  async (shabbatId, { rejectWithValue }) => {
    try {
      const r = await api.get(`/shabbat/${shabbatId}/`);
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה');
    }
  }
);

export const openShabbat = createAsyncThunk<Shabbat, Record<string, unknown>>(
  'shabbat/open',
  async (data, { rejectWithValue }) => {
    try {
      const r = await api.post('/shabbat/', data);
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה בפתיחת שבת');
    }
  }
);

export const closeShabbat = createAsyncThunk<number, number>(
  'shabbat/close',
  async (shabbatId, { rejectWithValue }) => {
    try {
      await api.put(`/shabbat/${shabbatId}/close/`);
      return shabbatId;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה בסגירת משמרת');
    }
  }
);

export const updateInventory = createAsyncThunk<Shabbat, { shabbatId: number; items: unknown[] }>(
  'shabbat/updateInventory',
  async ({ shabbatId, items }, { rejectWithValue }) => {
    try {
      await api.put(`/shabbat/${shabbatId}/inventory/`, items);
      const r = await api.get('/shabbat/current/');
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה בעדכון מלאי');
    }
  }
);

export const deleteShabbat = createAsyncThunk<number, number>(
  'shabbat/delete',
  async (shabbatId, { rejectWithValue }) => {
    try {
      await api.delete(`/shabbat/${shabbatId}/delete/`);
      return shabbatId;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || { detail: 'שגיאה במחיקת שבת' });
    }
  }
);

const shabbatSlice = createSlice({
  name: 'shabbat',
  initialState: { current: null, all: [], detail: null, loading: false, error: null } as ShabbatState,
  reducers: {
    clearCurrent(state) { state.current = null; },
    clearDetail(state) { state.detail = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentShabbat.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCurrentShabbat.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchCurrentShabbat.rejected, (state, action) => { state.loading = false; state.current = null; state.error = action.payload as string; })
      .addCase(fetchAllShabbats.pending, (state) => { state.loading = true; })
      .addCase(fetchAllShabbats.fulfilled, (state, action) => { state.loading = false; state.all = action.payload; })
      .addCase(fetchAllShabbats.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchShabbatDetail.pending, (state) => { state.loading = true; })
      .addCase(fetchShabbatDetail.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
      .addCase(fetchShabbatDetail.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(openShabbat.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(closeShabbat.fulfilled, (state) => { state.current = null; })
      .addCase(updateInventory.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(deleteShabbat.fulfilled, (state, action) => {
        state.all = state.all.filter((s) => s.id !== action.payload);
        if (state.current?.id === action.payload) state.current = null;
      });
  },
});

export const { clearCurrent, clearDetail } = shabbatSlice.actions;
export default shabbatSlice.reducer;
