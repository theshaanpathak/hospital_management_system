import React from 'react';

/**
 * Reusable Icon component for consistent sizing and styling across the HMS.
 * Uses Lucide React icons under the hood.
 */
function AppIcon({ icon: Icon, size = 20, className = "" }) {
    if (!Icon) return null;
    return (
        <Icon 
            size={size} 
            strokeWidth={2} 
            className={`lucide-icon ${className}`} 
            style={{ display: 'inline-flex', verticalAlign: 'middle' }}
        />
    );
}

export default AppIcon;
