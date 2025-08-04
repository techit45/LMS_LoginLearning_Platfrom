/**
 * React compatibility layer to fix forwardRef issues
 * This ensures forwardRef is properly available across all components
 */
import * as React from 'react';

// Ensure forwardRef is available and properly exported
export const forwardRef = React.forwardRef || ((render) => {
  // Fallback for cases where forwardRef is undefined
  const ForwardedComponent = (props) => render(props, null);
  ForwardedComponent.displayName = 'ForwardedComponent';
  return ForwardedComponent;
});

// Re-export all React functionality
export * from 'react';
export default React;

// Ensure React is in global scope if needed
if (typeof window !== 'undefined') {
  window.React = React;
}