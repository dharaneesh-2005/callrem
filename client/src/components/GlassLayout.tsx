import { ReactNode } from 'react';

export function GlassLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Ambient light blob */}
      <div className="ambient-blob" />
      
      {/* Main content */}
      <div className="min-h-screen relative z-10">
        {children}
      </div>
    </>
  );
}

export function GlassContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-card animate-in ${className}`}>
      {children}
    </div>
  );
}

export function GlassButton({ 
  children, 
  onClick, 
  variant = 'glass',
  className = '',
  type = 'button',
  disabled = false
}: { 
  children: ReactNode; 
  onClick?: () => void;
  variant?: 'glass' | 'primary';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}) {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-glass';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

export function GlassInput({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  ...props
}: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`input-glass ${className}`}
      {...props}
    />
  );
}

export function GlassCard({ 
  children, 
  className = '',
  hover = true 
}: { 
  children: ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`glass-card ${hover ? '' : 'hover:transform-none'} ${className}`}>
      {children}
    </div>
  );
}
