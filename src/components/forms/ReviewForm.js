// Updated: src/ReviewForm.js
import React, { useState, useContext } from 'react'; // Added useContext
import axios from 'axios';
import AuthContext from './context/AuthContext'; // Added AuthContext
import { X, Send, Star, Loader2 } from 'lucide-react';
import StarRatingInput from './StarRatingInput';

const API_URL = process.env.REACT_APP_API_URL;

export default function ReviewForm({
  isOpen,
  onClose,
  theme,
  currentUser, // This prop is essential
  revieweeId,
  revieweeName,
  batteryId, // Use batteryId consistently if that's what the backend expects for the listing
  showAppNotification,
  onReviewSubmitted
}) {
  const { token } = useContext(AuthContext); // Get token from AuthContext
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
  const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
  const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;
  const secondaryButtonClass = `px-4 py-2 border rounded-md transition-colors ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!comment.trim()) { setError('Please enter a comment for your review.'); return; }
    
    if (!currentUser || !token) { // Check for token from context
      if(showAppNotification) showAppNotification("You must be logged in to submit a review.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const reviewData = {
        reviewedUserId: revieweeId,
        batteryId: batteryId || null, // Pass batteryId if available
        rating,
        comment: comment.trim(),
        // Determine reviewType based on context if needed, or let backend default
        // Example: if reviewing a seller in context of a battery, it's 'seller_review'
        reviewType: batteryId ? 'seller_review' : 'general_user_review',
      };

      await axios.post(`${API_URL}/api/reviews`, reviewData, { // Ensure route is /api/reviews
        headers: { Authorization: `Bearer ${token}` }, // Use token from context
      });

      if(showAppNotification) showAppNotification("Review submitted successfully!", "success");
      setRating(0);
      setComment('');
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err) {
      console.error("Error submitting review:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || "Failed to submit review.";
      setError(errorMsg);
      if(showAppNotification) showAppNotification(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-lg w-full`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>Leave a Review for {revieweeName || 'User'}</h3>
          <button onClick={onClose} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>Your Rating</label>
            <StarRatingInput rating={rating} setRating={setRating} theme={theme} />
          </div>
          <div>
            <label htmlFor="comment" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Your Comment</label>
            <textarea
              id="comment" name="comment" rows="4" value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full p-2.5 border rounded-md shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Share your experience..." />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className={secondaryButtonClass} disabled={isLoading}>Cancel</button>
            <button type="submit" className={`${primaryButtonClass} flex items-center justify-center`} disabled={isLoading || rating === 0 || !comment.trim()}>
              {isLoading ? (<> <Loader2 size={16} className="animate-spin mr-2" /> Submitting... </>) : (<> <Send size={16} className="mr-2" /> Submit Review </>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}