import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    className?: string;
}

// base styles implement several HCI-friendly defaults: sufficient hit area, focus ring, smooth transitions
const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
const variants: Record<string, string> = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => (
    <button
        {...props}
        className={`${base} ${variants[variant]} ${className} m-2 px-4 py-2`}
    >
        {children}
    </button>
);

export default Button;
