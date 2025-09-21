// src/UserAvatar.js
import React from 'react';

const UserAvatar = ({ user, size = 'md', theme = 'dark', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };

  const baseClasses = `rounded-full flex items-center justify-center font-semibold object-cover ${sizeClasses[size] || sizeClasses.md}`;
  const themeClasses = theme === 'dark'
    ? 'bg-slate-700 text-blue-400 ring-slate-600'
    : 'bg-blue-200 text-blue-700 ring-blue-300';

  if (user?.profilePictureUrl) {
    return (
      <img
        src={user.profilePictureUrl}
        alt={user.name || user.username || 'User Avatar'}
        className={`${baseClasses} ring-2 ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          e.target.style.display = 'none';
          const parent = e.target.parentNode;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = `${baseClasses} ${themeClasses} ring-2 ${className}`;
            fallback.textContent = user?.initials || user?.username?.charAt(0).toUpperCase() || '?';
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${themeClasses} ring-2 ${className}`}>
      {user?.initials || user?.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

export default UserAvatar;