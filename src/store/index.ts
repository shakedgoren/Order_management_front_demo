import { configureStore } from '@reduxjs/toolkit';
import shabbatReducer from './shabbatSlice';
import ordersReducer from './ordersSlice';
import customersReducer from './customersSlice';

const store = configureStore({
  reducer: {
    shabbat: shabbatReducer,
    orders: ordersReducer,
    customers: customersReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type { RootState } from '../types';
export default store;
