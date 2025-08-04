import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import React from 'react';

// Simplified toast components without forwardRef
const ToastProvider = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

const ToastViewport = ({ className, ...props }) => (
  <div
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
);

const getToastVariants = ({ variant = 'default' }) => {
  const baseClasses = 'data-[swipe=move]:transition-none group relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all';
  
  const variantClasses = {
    default: 'bg-background border',
    destructive: 'group destructive border-destructive bg-destructive text-destructive-foreground',
  };
  
  return `${baseClasses} ${variantClasses[variant] || variantClasses.default}`;
};

const Toast = ({ className, variant, ...props }) => {
  return (
    <div
      className={cn(getToastVariants({ variant }), className)}
      {...props}
    />
  );
};

const ToastAction = ({ className, ...props }) => (
  <button
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
);

const ToastClose = ({ className, ...props }) => (
  <button
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
);

const ToastTitle = ({ className, ...props }) => (
  <div
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
);

const ToastDescription = ({ className, ...props }) => (
  <div
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
);

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};