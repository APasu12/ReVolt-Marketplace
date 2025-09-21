// src/MessageItem.js
import React from 'react';
import UserAvatar from './UserAvatar'; // Assuming you have this

export default function MessageItem({ message, currentUser, theme, otherParticipant }) {
  const isCurrentUserSender = message.sender && message.sender.userId === currentUser.id;

  const cardBgClass = isCurrentUserSender
    ? (theme === 'dark' ? 'bg-blue-700' : 'bg-blue-500')
    : (theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200');
  const textClass = isCurrentUserSender
    ? 'text-white'
    : (theme === 'dark' ? 'text-slate-100' : 'text-gray-800');
  const alignmentClass = isCurrentUserSender ? 'items-end' : 'items-start';
  const textAlignClass = isCurrentUserSender ? 'text-right' : 'text-left';
  const bubbleMarginClass = isCurrentUserSender ? 'ml-auto' : 'mr-auto';

  const senderName = isCurrentUserSender ? "You" : (message.sender?.name || message.sender?.username || "Unknown User");
  
  const getParticipantForAvatar = () => {
    if (isCurrentUserSender) return currentUser;
    return otherParticipant?.userId === message.sender?.userId ? otherParticipant : message.sender;
  };

  const participantForAvatar = getParticipantForAvatar();


  return (
    <div className={`flex flex-col mb-3 ${alignmentClass}`}>
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
        {!isCurrentUserSender && participantForAvatar && (
          <UserAvatar 
            user={{
                profilePictureUrl: participantForAvatar.profilePictureUrl, 
                name: participantForAvatar.name, 
                initials: participantForAvatar.initials
            }} 
            size="sm" 
            theme={theme}
            className="mb-1 flex-shrink-0"
          />
        )}
         {isCurrentUserSender && participantForAvatar && ( // Avatar on the right for current user
          <div className="ml-auto order-2"> {/* This pushes avatar to right within its container */}
             {/* Avatar placeholder, can be added if desired */}
          </div>
        )}
        <div 
            className={`p-3 rounded-lg ${cardBgClass} ${bubbleMarginClass} shadow-sm`}
            style={{ 
                borderBottomRightRadius: isCurrentUserSender ? '0.25rem' : '0.75rem', 
                borderBottomLeftRadius: isCurrentUserSender ? '0.75rem' : '0.25rem'
            }}
        >
          <p className={`text-xs font-medium mb-1 ${textClass} ${textAlignClass}`}>
            {senderName}
          </p>
          <p className={`text-sm ${textClass} whitespace-pre-wrap break-words`}>{message.text}</p>
          <p className={`text-xs mt-1.5 ${isCurrentUserSender ? 'text-blue-200' : (theme === 'dark' ? 'text-slate-400' : 'text-gray-500')} ${textAlignClass}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}