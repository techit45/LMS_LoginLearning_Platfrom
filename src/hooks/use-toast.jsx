import React, { createContext, useContext, useReducer, useCallback } from 'react';

const ToastContext = createContext();

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.toast];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.id);
    case 'CLEAR_TOASTS':
      return [];
    default:
      return state;
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title,
      description,
      variant,
      duration,
    };
    
    dispatch({ type: 'ADD_TOAST', toast: newToast });
    
    // Auto remove toast after duration
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id });
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, removeToast, clearToasts, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Export the toast function directly from the hook