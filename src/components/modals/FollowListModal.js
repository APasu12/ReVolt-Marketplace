// src/FollowListModal.js
import React from 'react';
import { X, UserCircle, Users } from 'lucide-react';
import UserAvatar from './UserAvatar';

const FollowListModal = ({
  isOpen,
  onClose,
  title,
  users,
  theme,
  onNavigateToUserProfile,
  isLoading // Optional: to show a loading state within the modal
}) => {
  if (!isOpen) return null;

  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-600';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`${cardBgClass} rounded-lg shadow-xl p-0 max-w-md w-full max-h-[80vh] flex flex-col`}>
        <div className={`flex justify-between items-center p-4 border-b ${borderClass}`}>
          <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
            <Users size={20} className="mr-2" /> {title} ({users?.length || 0})
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-200'}`}
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <p className={textSecondaryClass}>Loading users...</p>
          </div>
        ) : users && users.length > 0 ? (
          <ul className={`divide-y ${borderClass} overflow-y-auto flex-grow`}>
            {users.map((user) => (
              <li
                key={user.userId}
                className={`p-3 ${hoverBgClass} transition-colors duration-150 flex items-center space-x-3`}
              >
                <UserAvatar
                  user={{
                    userId: user.userId,
                    profilePictureUrl: user.profilePictureUrl,
                    initials: user.initials,
                    username: user.username,
                    name: user.name,
                  }}
                  size="md"
                  theme={theme}
                />
                <div className="flex-grow">
                  <button
                    onClick={() => {
                      if (onNavigateToUserProfile) {
                        onNavigateToUserProfile(user.userId);
                        onClose(); // Close modal after navigation
                      }
                    }}
                    className={`text-sm font-semibold ${textPrimaryClass} hover:underline text-left`}
                  >
                    {user.name || user.username}
                  </button>
                  {user.name && user.username && (
                     <p className={`text-xs ${textSecondaryClass}`}>@{user.username}</p>
                  )}
                </div>
                {/* Optionally add a follow/unfollow button here too if currentUser matches */}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <p className={textSecondaryClass}>No users to display.</p>
          </div>
        )}

        <div className={`p-4 border-t ${borderClass} text-right`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-md text-sm transition-colors ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;