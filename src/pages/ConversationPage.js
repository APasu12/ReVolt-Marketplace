// Updated: src/ConversationPage.js
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
import MessageItem from './MessageItem';
import UserAvatar from './UserAvatar';
import { Send, ArrowLeft, Loader2, AlertTriangle, Info, Paperclip, Battery, ArrowUpCircle } from 'lucide-react'; // Added ArrowUpCircle

const API_URL = process.env.REACT_APP_API_URL;

export default function ConversationPage({ // Renamed component from ConversationView
  theme,
  showAppNotification,
  currentUser,
  conversationId,
  initialOtherParticipant,
  initialRelatedBattery,
  onBackToInbox
}) {
  const { token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [otherParticipant, setOtherParticipant] = useState(initialOtherParticipant);
  const [relatedBattery, setRelatedBattery] = useState(initialRelatedBattery);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);


  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null); // To scroll to bottom for new messages

  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200 placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400';
  const sendButtonClass = `p-2.5 rounded-md flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const loadMoreButtonClass = `px-4 py-2 text-sm rounded-md transition-colors ${theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`;


  const scrollToBottom = useCallback(() => {
    // Only scroll to bottom if messagesEndRef is available and not loading more (to avoid jump)
    if (messagesEndRef.current && !isLoadingMore && initialLoadComplete) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isLoadingMore, initialLoadComplete]);

  const fetchMessages = useCallback(async (page = 1, loadMore = false) => {
    if (!conversationId || !token) {
        setError("Conversation ID or authentication token is missing.");
        if (!loadMore) setIsLoading(false); else setIsLoadingMore(false);
        return;
    }
    
    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/api/messaging/conversations/${conversationId}/messages?page=${page}&limit=20`, // Standard limit
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data; // Expects { messages: [], currentPage, totalPages, totalMessages }

      const newMessages = data.messages || [];

      // Preserve scroll position when loading older messages
      let oldScrollHeight = 0;
      let oldScrollTop = 0;
      if (loadMore && messagesContainerRef.current) {
          oldScrollHeight = messagesContainerRef.current.scrollHeight;
          oldScrollTop = messagesContainerRef.current.scrollTop;
      }

      setMessages(prevMessages => loadMore ? [...newMessages, ...prevMessages] : newMessages);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalMessages(data.totalMessages);

      if (loadMore && messagesContainerRef.current) {
          // After new messages are prepended and DOM updates, adjust scroll
          requestAnimationFrame(() => { // Ensures DOM has updated
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
          });
      } else if (!loadMore) {
        setInitialLoadComplete(true); // Mark initial load as complete
        // scrollToBottom will be called by the useEffect for messages change
      }

    } catch (err) {
      console.error("Fetch Messages Error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.msg || "Could not load messages.";
      setError(errorMsg);
      if (showAppNotification) showAppNotification(errorMsg, "error");
    } finally {
      if (loadMore) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  }, [conversationId, token, showAppNotification]);

  useEffect(() => {
    if(conversationId) { // Only fetch if conversationId is present
        setMessages([]); // Clear previous messages
        setCurrentPage(1);
        setTotalPages(1);
        setTotalMessages(0);
        setInitialLoadComplete(false); // Reset for new conversation
        fetchMessages(1, false);
    }
  }, [conversationId, fetchMessages]); // Rerun if conversationId changes

  useEffect(() => {
    // Scroll to bottom only after initial messages are loaded and not when loading more
    if (initialLoadComplete && messages.length > 0 && !isLoadingMore) {
        const timeoutId = setTimeout(scrollToBottom, 100); // Small delay for rendering
        return () => clearTimeout(timeoutId);
    }
  }, [messages, initialLoadComplete, isLoadingMore, scrollToBottom]);
  
  useEffect(() => {
    setOtherParticipant(initialOtherParticipant);
    setRelatedBattery(initialRelatedBattery);
  }, [initialOtherParticipant, initialRelatedBattery]);


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !conversationId || !token || !currentUser) return;
    
    setIsSending(true);
    const optimisticMessage = {
        messageId: `temp-${Date.now()}`,
        text: newMessageText.trim(),
        createdAt: new Date().toISOString(),
        sender: {
            userId: currentUser.id,
            username: currentUser.username,
            name: currentUser.name,
            profilePictureUrl: currentUser.profilePictureUrl,
            initials: currentUser.initials
        },
        optimistic: true
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessageText('');
    // Call scrollToBottom after optimistic update
    requestAnimationFrame(() => scrollToBottom());


    try {
      const response = await axios.post(
        `${API_URL}/api/messaging/conversations/${conversationId}/messages`,
        { text: optimisticMessage.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.messageId === optimisticMessage.messageId ? response.data : msg
      ));
    } catch (err) {
      console.error("Send Message Error:", err.response?.data || err.message);
      if (showAppNotification) showAppNotification(err.response?.data?.msg || "Failed to send message.", "error");
      setMessages(prevMessages => prevMessages.filter(msg => msg.messageId !== optimisticMessage.messageId));
      setNewMessageText(optimisticMessage.text);
    } finally {
      setIsSending(false);
    }
  };

  const handleLoadMoreMessages = () => {
    if (currentPage < totalPages && !isLoadingMore) {
        fetchMessages(currentPage + 1, true);
    }
  };

  if (!conversationId) { // Handle case where conversationId might not be ready
    return (
      <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center h-full flex flex-col justify-center items-center`}>
        <Info size={48} className={`mx-auto mb-4 ${textMutedClass}`} />
        <p className={textSecondaryClass}>No conversation selected.</p>
        <button onClick={onBackToInbox} className={`mt-4 ${loadMoreButtonClass}`}>Back to Inbox</button>
      </div>
    );
  }

  if (isLoading && !isLoadingMore) { // Only show full page loader on initial load
    return (
      <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center h-full flex flex-col justify-center`}>
        <Loader2 size={48} className={`mx-auto mb-4 ${textMutedClass} animate-spin`} />
        <p className={textSecondaryClass}>Loading Conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center h-full flex flex-col justify-center`}>
        <AlertTriangle size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
        <h3 className={`text-xl font-semibold ${textPrimaryClass} mb-2`}>Error Loading Conversation</h3>
        <p className={textSecondaryClass}>{error}</p>
        <button onClick={() => fetchMessages(1, false)} className={`mt-4 ${loadMoreButtonClass}`}>Try Again</button>
      </div>
    );
  }
  
  const displayName = otherParticipant?.name || otherParticipant?.username || "User";

  return (
    <div className={`${cardBgClass} rounded-lg shadow flex flex-col h-full max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-12rem)]`}> {/* Adjusted max-h for responsiveness */}
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b ${borderClass} flex items-center space-x-3 sticky top-0 ${cardBgClass} z-10`}>
        <button onClick={onBackToInbox} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`} title="Back to Inbox">
          <ArrowLeft size={20} className={textSecondaryClass} />
        </button>
        {otherParticipant && (
          <UserAvatar user={otherParticipant} size="md" theme={theme} />
        )}
        <div>
            <h2 className={`text-base sm:text-lg font-semibold ${textPrimaryClass} truncate`}>{displayName}</h2>
            {relatedBattery && (
                <p className={`text-xs ${textMutedClass} truncate flex items-center`}>
                    <Battery size={12} className="mr-1 flex-shrink-0"/> 
                    Re: {relatedBattery.manufacturer} {relatedBattery.model}
                </p>
            )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-grow p-3 sm:p-4 space-y-4 overflow-y-auto flex flex-col"> {/* Use flex-col for message ordering */}
        {/* Load More Messages Button */}
        {currentPage < totalPages && !isLoading && (
          <div className="text-center my-2">
            <button 
              onClick={handleLoadMoreMessages} 
              disabled={isLoadingMore}
              className={`${loadMoreButtonClass} flex items-center justify-center mx-auto`}
            >
              {isLoadingMore ? <Loader2 size={16} className="animate-spin mr-2"/> : <ArrowUpCircle size={16} className="mr-2"/>}
              {isLoadingMore ? 'Loading...' : 'Load Older Messages'}
            </button>
          </div>
        )}
        {isLoadingMore && currentPage < totalPages && ( // Persistent small loader while loading more
             <div className="text-center py-2">
                <Loader2 size={20} className={`mx-auto ${textMutedClass} animate-spin`} />
            </div>
        )}

        {messages.length === 0 && !isLoading && !isLoadingMore ? (
            <div className="flex flex-col items-center justify-center flex-grow text-center"> {/* Use flex-grow */}
                <Info size={32} className={`mb-2 ${textMutedClass}`} />
                <p className={textSecondaryClass}>No messages in this conversation yet.</p>
                <p className={textMutedClass}>Send a message to start talking!</p>
            </div>
        ) : (
            messages.map(msg => (
                <MessageItem 
                    key={msg.messageId || msg.id}
                    message={msg} 
                    currentUser={currentUser} 
                    theme={theme}
                    otherParticipant={otherParticipant}
                />
            ))
        )}
        <div ref={messagesEndRef} /> {/* For scrolling to new messages */}
      </div>

      {/* Message Input Area */}
      <div className={`p-3 sm:p-4 border-t ${borderClass} mt-auto sticky bottom-0 ${cardBgClass} z-10`}>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 sm:space-x-3">
          <input
            type="text"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder={`Message ${displayName}...`}
            className={`flex-grow p-2.5 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}
            disabled={isSending}
          />
          <button type="submit" className={`${sendButtonClass} ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={isSending || !newMessageText.trim()}>
            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}