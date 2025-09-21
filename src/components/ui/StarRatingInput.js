// src/StarRatingInput.js
import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRatingInput = ({ rating, setRating, theme, maxRating = 5 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starColor = theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500';
  const emptyStarColor = theme === 'dark' ? 'text-slate-600' : 'text-gray-300';
  const hoverFillClass = theme === 'dark' ? 'fill-yellow-400' : 'fill-yellow-500';
  const fillClass = theme === 'dark' ? 'fill-yellow-400' : 'fill-yellow-500';
  const emptyFillClass = theme === 'dark' ? 'fill-slate-600' : 'fill-gray-300';


  return (
    <div className="flex items-center space-x-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button" // Important for forms
            key={starValue}
            className={`focus:outline-none transition-colors duration-150 ${starColor}`}
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
          >
            <Star
              size={28}
              className={
                (hoverRating >= starValue || rating >= starValue)
                  ? hoverFillClass
                  : emptyFillClass
              }
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRatingInput;