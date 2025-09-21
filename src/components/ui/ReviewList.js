// Updated: src/ReviewList.js
import React from 'react';
import { Star } from 'lucide-react';
import UserAvatar from './UserAvatar';

const ReviewList = ({ reviews, theme, onViewUserProfile }) => {
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
  const cardItemBgClass = theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50/70';

  if (!reviews || reviews.length === 0) {
    return <p className={textSecondaryClass}>No reviews yet for this user.</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        // The backend now sends review.reviewer which is an object
        const reviewer = review.reviewer || {}; 
        return (
            <div key={review.reviewId} className={`p-4 rounded-md border ${borderClass} ${cardItemBgClass}`}>
            <div className="flex items-start space-x-3">
                <UserAvatar
                user={{
                    userId: reviewer.userId, // Pass userId if available for UserAvatar internal logic
                    profilePictureUrl: reviewer.profilePictureUrl,
                    initials: reviewer.initials,
                    username: reviewer.username, // Pass username as fallback for UserAvatar
                    name: reviewer.name // Pass name as primary for UserAvatar
                }}
                size="md"
                theme={theme}
                />
                <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    {onViewUserProfile && reviewer.userId ? (
                        <button
                            onClick={() => onViewUserProfile(reviewer.userId)}
                            className={`text-sm font-semibold ${textPrimaryClass} hover:underline`}
                        >
                            {reviewer.name || reviewer.username || 'Anonymous Reviewer'}
                        </button>
                    ) : (
                        <span className={`text-sm font-semibold ${textPrimaryClass}`}>
                            {reviewer.name || reviewer.username || 'Anonymous Reviewer'}
                        </span>
                    )}
                    <span className={`text-xs ${textMutedClass}`}>
                    {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex items-center mb-1.5">
                    {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? (theme === 'dark' ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-500 fill-yellow-500') : (theme === 'dark' ? 'text-slate-600 fill-slate-600' : 'text-gray-300 fill-gray-300')}
                    />
                    ))}
                    {/* Backend does not yet provide isVerifiedTransaction for Review model
                    {review.isVerifiedTransaction && (
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${theme === 'dark' ? 'bg-green-700 text-green-200' : 'bg-green-100 text-green-800'}`}>
                            Verified
                        </span>
                    )}
                    */}
                </div>
                <p className={`text-sm ${textSecondaryClass}`} style={{ whiteSpace: 'pre-wrap' }}>{review.comment}</p>
                {review.batteryReviewed && (
                    <p className={`text-xs mt-2 ${textMutedClass}`}>
                        Review for battery: {review.batteryReviewed.manufacturer} {review.batteryReviewed.model}
                    </p>
                )}
                </div>
            </div>
            </div>
        );
      })}
    </div>
  );
};

export default ReviewList;