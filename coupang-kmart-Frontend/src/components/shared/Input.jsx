import React from 'react';
import './Input.css';

const Input = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className={`input-container ${className}`}>
            {label && <label className="input-label">{label}</label>}
            <div className={`input-wrapper ${error ? 'input-error-state' : ''}`}>
                {Icon && <Icon className="input-icon" size={18} />}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`input-field ${Icon ? 'with-icon' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};

export default Input;
