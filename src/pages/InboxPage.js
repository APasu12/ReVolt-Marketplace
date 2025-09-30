import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
import UserAvatar from './UserAvatar';
import { Inbox as InboxIcon, Loader2, AlertTriangle, MessageSquare, Search, Circle } from 'lucide-react'; // Added Circle for unread dot

const API_URL = process.env.REACT_APP_API_URL;

export default function InboxPage({ theme, showAppNotification, onSelectConversation, currentUser }) {
  const { token } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-600';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white text-gray-900 placeholder-gray-400';


  const fetchConversations = useCallback(async () => {
    if (!token || !currentUser) { // Ensure currentUser is also available
      setError("Authentication required to view messages.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/messaging/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Expects backend to provide 'hasUnreadMessages' for each conversation
      setConversations(response.data || []);
    } catch (err) {
      console.error("Fetch Conversations Error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Could not load conversations.");
      if (showAppNotification) showAppNotification(err.response?.data?.msg || "Could not load conversations.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, showAppNotification, currentUser]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getOtherParticipant = (conversation) => {
    if (!currentUser || !conversation.participants) return null;
    // The 'participants' array from the updated getConversations controller
    // now directly contains the *other* participant(s).
    // If it contains multiple, take the first one. If it's an empty array, means no other participant (should not happen in a 1-on-1).
    return conversation.participants.length > 0 ? conversation.participants[0] : null;
  };

  const filteredConversations = conversations.filter(convo => {
    const otherParticipant = getOtherParticipant(convo);
    const lastMessage = convo.messages && convo.messages.length > 0 ? convo.messages[0] : null; // lastMessage is already in convo.messages[0]
    const relatedBattery = convo.relatedBattery;
    const searchTermLower = searchTerm.toLowerCase();

    return (
        (otherParticipant?.name?.toLowerCase().includes(searchTermLower)) ||
        (otherParticipant?.username?.toLowerCase().includes(searchTermLower)) ||
        (convo.lastMessageTextSnippet?.toLowerCase().includes(searchTermLower)) || // Use snippet
        (relatedBattery?.manufacturer?.toLowerCase().includes(searchTermLower)) ||
        (relatedBattery?.model?.toLowerCase().includes(searchTermLower))
    );
  });

  if (isLoading) { /* ... same as before ... */ }
  if (error) { /* ... same as before ... */ }

  return (
    <div className={`${cardBgClass} rounded-lg shadow`}>
      <div className={`p-4 sm:p-6 border-b ${borderClass} flex flex-col sm:flex-row justify-between items-center gap-3`}>
        {/* header same as before */}
        <div className="flex items-center space-x-3">
            <MessageSquare size={28} className={textPrimaryClass} />
            <h1 className={`text-2xl font-bold ${textPrimaryClass}`}>Inbox</h1>
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className={textMutedClass} />
            </div>
            <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}
            />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        // no conversations message
        <div className="p-10 text-center">
          <InboxIcon size={48} className={`mx-auto mb-4 ${textMutedClass}`} />
          <h3 className={`text-lg font-semibold ${textPrimaryClass} mb-2`}>
            {searchTerm ? "No conversations match your search." : "No conversations yet."}
          </h3>
          <p className={textSecondaryClass}>
            {searchTerm ? "Try a different search term." : "Start a conversation by contacting a seller on a marketplace listing."}
          </p>
        </div>
      ) : (
        <ul className={`divide-y ${borderClass}`}>
          {filteredConversations.map(convo => {
            const otherParticipant = getOtherParticipant(convo); // getOtherParticipant now uses convo.participants directly
            const lastMessage = convo.messages && convo.messages.length > 0 ? convo.messages[0] : null;
            const isLastMessageFromCurrentUser = lastMessage?.sender?.userId === currentUser?.id;

            // Use convo.hasUnreadMessages from the backend
            const hasUnread = convo.hasUnreadMessages;

            return (
              <li 
                key={convo.id} 
                onClick={() => {
                    if (onSelectConversation && otherParticipant) { // Ensure otherParticipant is valid
                        onSelectConversation(convo.id, otherParticipant, convo.relatedBattery);
                        // Optimistically mark as read on frontend if desired, or rely on backend
                        // This might require a re-fetch or state update in InboxPage if not handled globally
                    }
                }}
                className={`p-4 sm:p-5 cursor-pointer ${hoverBgClass} transition-colors duration-150 flex items-start space-x-3 sm:space-x-4 relative`}
              >
                {/* Unread indicator dot */}
                {hasUnread && ( // Use the hasUnread flag from backend
                  <Circle size={10} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-500 fill-blue-500" title="Unread messages"/>
                )}

                {otherParticipant && (
                  <UserAvatar 
                    user={otherParticipant} 
                    size="md" 
                    theme={theme}
                    className="flex-shrink-0 mt-1"
                  />
                )}
                <div className={`flex-grow overflow-hidden ${hasUnread ? 'pl-2' : ''}`}> {/* Adjusted padding for dot */}
                  <div className="flex justify-between items-baseline">
                    <h3 className={`text-sm sm:text-base truncate ${textPrimaryClass} ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                      {otherParticipant?.name || otherParticipant?.username || 'Unknown User'}
                    </h3>
                    {lastMessage && (
                      <p className={`text-xs ${textMutedClass} flex-shrink-0 ml-2 ${hasUnread ? 'font-bold text-blue-400 dark:text-blue-300' : ''}`}>
                        {new Date(lastMessage.createdAt).toLocaleDateString([], { month:'short', day:'numeric' })}
                      </p>
                    )}
                  </div>
                  {convo.relatedBattery && (
                    <p className={`text-xs ${textMutedClass} truncate ${hasUnread ? 'font-semibold' : ''}`}>
                        Re: {convo.relatedBattery.manufacturer} {convo.relatedBattery.model}
                    </p>
                  )}
                  <p className={`text-xs sm:text-sm truncate mt-0.5 ${hasUnread ? `font-semibold ${textPrimaryClass}` : textSecondaryClass}`}>
                    {isLastMessageFromCurrentUser && "You: "} {convo.lastMessageTextSnippet || (lastMessage ? lastMessage.text : "No messages yet.")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
