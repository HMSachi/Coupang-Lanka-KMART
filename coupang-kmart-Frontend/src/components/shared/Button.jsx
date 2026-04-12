import React from 'react';
import './Button.css';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    icon: Icon,
    fullWidth = false
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn-custom btn-${variant} btn-size-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
        >
            {Icon && <Icon className="btn-icon" size={18} />}
            <span className="btn-content">{children}</span>
        </button>
    );
};

export default Button;
