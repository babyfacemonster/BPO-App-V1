
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
      secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700',
      ghost: 'hover:bg-gray-100 text-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700'
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none px-4 py-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Card: React.FC<{ className?: string, children?: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("rounded-xl border bg-white text-gray-950 shadow", className)}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ className?: string, children?: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);

export const CardTitle: React.FC<{ className?: string, children?: React.ReactNode }> = ({ className, children }) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)}>{children}</h3>
);

export const CardContent: React.FC<{ className?: string, children?: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("p-6 pt-0", className)}>{children}</div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Badge: React.FC<{ children?: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' }> = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[variant])}>
      {children}
    </span>
  );
};

export const Tooltip = ({ content, children, side = 'top', className }: { content: React.ReactNode, children?: React.ReactNode, side?: 'top' | 'bottom' | 'left' | 'right', className?: string }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent",
    right: "left-[-4px] top-1/2 -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent"
  };

  return (
    <div 
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-md shadow-lg w-max max-w-[220px] whitespace-normal text-center pointer-events-none animate-in fade-in zoom-in-95 duration-100",
          positionClasses[side]
        )}>
          {content}
          <div className={cn(
            "absolute w-0 h-0 border-4",
            arrowClasses[side]
          )} />
        </div>
      )}
    </div>
  );
};
