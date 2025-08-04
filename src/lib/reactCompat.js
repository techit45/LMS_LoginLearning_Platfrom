/**
 * React compatibility layer to ensure proper React functionality
 * This ensures all React hooks and functions are properly available
 */
import * as React from 'react';

// Ensure all React hooks are available
export const {
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useDeferredValue,
  useTransition,
  useId,
  useSyncExternalStore,
  forwardRef,
  createContext,
  createElement,
  cloneElement,
  isValidElement,
  Fragment,
  StrictMode,
  Suspense,
  lazy,
  memo,
  Component,
  PureComponent
} = React;

// Fallback for forwardRef if still undefined
export const safeForwardRef = React.forwardRef || ((render) => {
  const ForwardedComponent = (props) => render(props, null);
  ForwardedComponent.displayName = 'ForwardedComponent';
  return ForwardedComponent;
});

// Re-export all React functionality
export * from 'react';
export default React;

// Ensure React is globally available
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = React;
}

// Debug logging
console.log('React compatibility layer loaded:', {
  version: React.version,
  hasUseState: !!React.useState,
  hasForwardRef: !!React.forwardRef,
  reactKeys: Object.keys(React)
});