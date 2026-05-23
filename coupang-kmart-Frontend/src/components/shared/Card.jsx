import React from 'react';
import './Card.css';

const Card = ({
    children,
    title,
    subtitle,
    className = '',
    glass = false,
    white = false,
    padding = 'lg'
}) => {
    return (
        <div className={`card-custom ${glass ? 'card-glass' : ''} ${white ? 'card-white' : ''} card-p-${padding} ${className}`}>
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="card-content">
                {children}
            </div>
        </div>
    );
};

export default Card;
