import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';
import { CustomersState, Customer } from '../types';

export const searchCustomers = createAsyncThunk<Customer[], string>(
  'customers/search',
  async (name, { rejectWithValue }) => {
    try {
      const r = await api.get(`/customers/?name=${encodeURIComponent(name)}`);
      return r.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'שגיאה');
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: { suggestions: [], loading: false } as CustomersState,
  reducers: {
    clearSuggestions(state) { state.suggestions = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchCustomers.pending, (state) => { state.loading = true; })
      .addCase(searchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload;
      })
      .addCase(searchCustomers.rejected, (state) => { state.loading = false; });
  },
});

export const { clearSuggestions } = customersSlice.actions;
export default customersSlice.reducer;
