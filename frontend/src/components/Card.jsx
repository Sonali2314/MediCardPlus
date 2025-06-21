import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  footer,
  className = "", 
  onClick = null,
  hoverable = false
}) => {
  const cardStyles = `bg-white rounded-lg shadow-md overflow-hidden ${hoverable ? 'hover:shadow-lg transition-shadow duration-300' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`;
  
  return (
    <div className={cardStyles} onClick={onClick}>
      {(title || icon) && (
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;