// src/UserProfilePage.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import axiosInstance from './api/axiosConfig'; // CORRECTED: Using the configured axios instance
import AuthContext from './context/AuthContext';
import {
    Briefcase, MapPin, CalendarDays, Award, Link as LinkIcon, User, Mail, Edit3, Star,
    MessageSquarePlus, Loader2, AlertTriangle, Trash2, XCircle, UserPlus, UserMinus
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import FollowListModal from './FollowListModal';

// This function can remain as a local helper
const defaultCalculateMetrics = (battery) => {
    if (!battery) return { stateOfHealth: 'N/A', listingPriceString: 'N/A' };
    const soh = battery.originalCapacity && battery.currentCapacity && parseFloat(battery.originalCapacity) > 0
        ? Math.round((parseFloat(battery.currentCapacity) / parseFloat(battery.originalCapacity)) * 100)
        : 'N/A';
    let priceString;
    if (battery.listingType === 'For Sale') {
        priceString = battery.listingPrice && !isNaN(parseFloat(battery.listingPrice))
            ? `$${parseFloat(battery.listingPrice).toLocaleString()}`
            : 'Contact Seller';
    } else if (['Seeking Offers','For Lease'].includes(battery.listingType)) {
        priceString = battery.listingType;
    } else {
        priceString = 'N/A';
    }
    return { stateOfHealth: soh, listingPriceString: priceString };
};

export default function UserProfilePage({
    userId,
    theme,
    currentUser,
    showAppNotification,
    onNavigateToEditProfile,
    onViewBatteryDetails,
    calculateMetrics = defaultCalculateMetrics,
    onNavigateToUserProfile,
    onInitiateConversation,
    onAccountDeletionRequested
}) {
    const { token } = useContext(AuthContext);

    const [profileData, setProfileData] = useState(null);
    const [userListings, setUserListings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [showFollowListModal, setShowFollowListModal] = useState(false);
    const [followListTitle, setFollowListTitle] = useState('');
    const [followListUsers, setFollowListUsers] = useState([]);
    const [isFollowListLoading, setIsFollowListLoading] = useState(false);

    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
    const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
    const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
    const hoverCardClass = theme === 'dark' ? 'hover:bg-slate-700/70' : 'hover:bg-gray-50/70';
    const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;
    const secondaryButtonClass = `px-4 py-2 border rounded-md transition-colors ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
    const destructiveConfirmButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-red-700 hover:bg-red-800 focus:ring-red-600'}`;

    const fetchFollowData = useCallback(async () => {
        if (!userId) return;
        
        if (currentUser && currentUser.userId !== userId) {
            setIsFollowLoading(true);
        }

        try {
            // CORRECTED: Using axiosInstance and relative paths
            const followersPromise = axiosInstance.get(`/api/users/${userId}/followers`);
            const followingPromise = axiosInstance.get(`/api/users/${userId}/following`);
            let followStatusPromise;

            // CORRECTED: Removed manual auth header; interceptor handles it
            if (currentUser && currentUser.userId !== userId) {
                followStatusPromise = axiosInstance.get(`/api/users/${userId}/follow-status`);
            } else {
                followStatusPromise = Promise.resolve({ data: { isFollowing: false, isSelf: currentUser?.userId === userId } });
            }

            const [followersRes, followingRes, followStatusRes] = await Promise.all([
                followersPromise, followingPromise, followStatusPromise
            ]);

            setFollowersCount(followersRes.data?.length || 0);
            setFollowingCount(followingRes.data?.length || 0);
            if (!followStatusRes.data?.isSelf) {
                 setIsFollowing(followStatusRes.data?.isFollowing || false);
            }
        } catch (err) {
            console.error("Error fetching follow data:", err.response?.data || err.message);
        } finally {
            if (currentUser && currentUser.userId !== userId) {
                setIsFollowLoading(false);
            }
        }
    }, [userId, currentUser]);

    const fetchAllProfileData = useCallback(async () => {
        if (!userId) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            // CORRECTED: Using axiosInstance and relative paths
            const [profileRes, listingsRes, reviewsRes] = await Promise.all([
                axiosInstance.get(`/api/profile/${userId}`),
                axiosInstance.get(`/api/batteries/public/listings`, { params: { ownerId: userId } }),
                axiosInstance.get(`/api/reviews/user/${userId}`)
            ]);
            setProfileData(profileRes.data);
            setUserListings(listingsRes.data || []);
            setReviews(reviewsRes.data || []);
            await fetchFollowData();
        } catch (error) {
            const errorMessage = error.response?.data?.msg || 'Could not load profile data.';
            showAppNotification(errorMessage, "error");
            setProfileData(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId, showAppNotification, fetchFollowData]);

    useEffect(() => {
        if (userId) { fetchAllProfileData(); }
        else { setProfileData(null); setUserListings([]); setReviews([]); setIsLoading(false); setFollowersCount(0); setFollowingCount(0); setIsFollowing(false); }
    }, [userId, fetchAllProfileData]);

    const handleReviewSubmitted = () => { fetchAllProfileData(); };
    
    const handleContactUser = () => {
        if (!currentUser) { showAppNotification("Please log in to contact users.", "info"); return; }
        if (profileData?.userId === currentUser.userId) { showAppNotification("You cannot start a conversation with yourself.", "info"); return; }
        if (onInitiateConversation && profileData?.userId) {
            onInitiateConversation(profileData.userId, null);
        }
    };

    const handleDeleteAccountClick = () => { setShowDeleteConfirmModal(true); };

    const handleConfirmAccountDeletion = async () => {
        if (!onAccountDeletionRequested) { showAppNotification("Account deletion feature not available.", "error"); return; }
        setIsDeletingAccount(true);
        const success = await onAccountDeletionRequested();
        if (!success) { setIsDeletingAccount(false); setShowDeleteConfirmModal(false); }
    };

    const handleFollowToggle = async () => {
        if (!currentUser || !profileData || currentUser.userId === profileData.userId) {
            showAppNotification("Login required or you cannot follow yourself.", "info");
            return;
        }
        setIsFollowLoading(true);
        // CORRECTED: Using relative path
        const endpoint = `/api/users/${profileData.userId}/${isFollowing ? 'unfollow' : 'follow'}`;
        const method = isFollowing ? 'delete' : 'post';
        try {
            // CORRECTED: Using axiosInstance and no manual headers
            await axiosInstance({ method, url: endpoint });
            const newIsFollowing = !isFollowing;
            setIsFollowing(newIsFollowing);
            setFollowersCount(prev => newIsFollowing ? prev + 1 : Math.max(0, prev - 1));
            showAppNotification(`Successfully ${newIsFollowing ? 'followed' : 'unfollowed'} ${profileData.username}.`, "success");
        } catch (error) {
            showAppNotification(error.response?.data?.msg || `Failed to ${isFollowing ? 'unfollow' : 'follow'}.`, "error");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const openFollowListModal = async (type) => {
        if (!userId) return;
        setFollowListTitle(type === 'followers' ? `Followers of ${profileData?.username || ''}` : `Following`);
        setShowFollowListModal(true);
        setIsFollowListLoading(true);
        setFollowListUsers([]);
        try {
            // CORRECTED: Using axiosInstance and relative path
            const endpoint = `/api/users/${userId}/${type}`;
            const response = await axiosInstance.get(endpoint);
            setFollowListUsers(response.data || []);
        } catch (error) {
            showAppNotification(`Could not load ${type} list.`, "error");
        } finally {
            setIsFollowListLoading(false);
        }
    };

    const closeFollowListModal = () => {
        setShowFollowListModal(false);
        setFollowListUsers([]);
    };

    if (isLoading) { return ( <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center`}><Loader2 size={48} className={`mx-auto mb-4 ${textMutedClass} animate-pulse`} /><p className={textSecondaryClass}>Loading Profile...</p></div> ); }
    if (!profileData && !isLoading) { return ( <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center`}><User size={48} className={`mx-auto mb-4 ${textMutedClass}`} /><h3 className={`text-xl font-semibold ${textPrimaryClass} mb-2`}>Profile Not Available</h3><p className={textSecondaryClass}>The user profile could not be loaded or does not exist.</p></div> ); }
    
    const { name, username, bio, expertise, certifications, location, memberSince, sellerType, websiteUrl, companyName, averageRating, totalReviews, profilePictureUrl, initials } = profileData || {};
    const isOwnProfile = currentUser && currentUser.userId === userId;

    return (
        <div className="space-y-8">
            {/* JSX for rendering profile, unchanged from original */}
            <div className={`${cardBgClass} rounded-lg shadow-lg p-6 md:p-8`}>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <UserAvatar user={{profilePictureUrl, name, username, initials}} size="xl" theme={theme} className="flex-shrink-0"/>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className={`text-3xl font-bold ${textPrimaryClass}`}>{name || username || 'User'}</h1>
                        {companyName && <p className={`text-lg ${textSecondaryClass}`}>{companyName}</p>}
                        <p className={`text-md ${textMutedClass}`}>{username} {sellerType && sellerType !== 'Not Specified' && `• ${sellerType}`}</p>
                        
                        <div className={`mt-2 flex items-center justify-center md:justify-start space-x-4 text-sm ${textMutedClass}`}>
                            <button onClick={() => openFollowListModal('followers')} className="cursor-pointer hover:underline"><strong className={textSecondaryClass}>{followersCount}</strong> Followers</button>
                            <button onClick={() => openFollowListModal('following')} className="cursor-pointer hover:underline"><strong className={textSecondaryClass}>{followingCount}</strong> Following</button>
                        </div>

                        {typeof totalReviews === 'number' && totalReviews > 0 ? (
                            <div className="flex items-center justify-center md:justify-start space-x-1 mt-2">
                                {[...Array(Math.floor(averageRating))].map((_, i) => <Star key={`f-${i}`} size={18} className="text-yellow-400 fill-yellow-400" />)}
                                {averageRating % 1 >= 0.5 && <Star key="h" size={18} className="text-yellow-400 fill-yellow-200" />}
                                {[...Array(5 - Math.ceil(averageRating))].map((_, i) => <Star key={`e-${i}`} size={18} className={theme === 'dark' ? 'text-slate-600 fill-slate-600' : 'text-gray-300 fill-gray-300'} />)}
                                <span className={`text-sm ${textMutedClass}`}>({averageRating.toFixed(1)} from {totalReviews} review{totalReviews === 1 ? '' : 's'})</span>
                            </div>
                        ) : ( <p className={`text-sm ${textMutedClass} mt-2`}>Unrated User</p> )}
                        
                        <div className="mt-4 flex flex-col sm:flex-row justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-3">
                            {isOwnProfile ? (
                                <button onClick={onNavigateToEditProfile} className={`${primaryButtonClass} flex items-center justify-center text-sm`}><Edit3 size={16} className="mr-2"/> Edit Profile</button>
                            ) : (
                                <>
                                    <button onClick={() => setShowReviewModal(true)} className={`${secondaryButtonClass} flex items-center justify-center text-sm`}><MessageSquarePlus size={16} className="mr-2"/> Leave a Review</button>
                                    <button onClick={handleContactUser} className={`${secondaryButtonClass} flex items-center justify-center text-sm`}><Mail size={16} className="mr-2"/> Contact User</button>
                                    {currentUser && (
                                        <button onClick={handleFollowToggle} disabled={isFollowLoading} className={`${isFollowing ? secondaryButtonClass : primaryButtonClass} flex items-center justify-center text-sm w-auto disabled:opacity-70`}>
                                            {isFollowLoading ? <Loader2 size={16} className="animate-spin mr-2"/> : (isFollowing ? <UserMinus size={16} className="mr-2"/> : <UserPlus size={16} className="mr-2"/>)}
                                            {isFollowing ? 'Unfollow' : 'Follow'}
                                        </button>
                                    )}
                                </>
                            )}
                             {isOwnProfile && <button onClick={handleDeleteAccountClick} className={`px-4 py-2 border rounded-md transition-colors text-sm flex items-center justify-center ${theme === 'dark' ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' : 'border-red-400 text-red-600 hover:bg-red-500 hover:text-white'}`}><Trash2 size={16} className="mr-2"/> Delete Account</button>}
                        </div>
                    </div>
                </div>
                {bio && ( <div className={`mt-6 pt-6 border-t ${borderClass}`}><h3 className={`text-lg font-semibold ${textPrimaryClass} mb-2`}>About</h3><p className={`${textSecondaryClass} whitespace-pre-wrap`}>{bio}</p></div> )}
            </div>

            <div className={`${cardBgClass} rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4`}>
                {location && ( <div className="flex items-start space-x-3 py-2"><MapPin size={20} className={`mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} /><div><h4 className={`text-xs font-medium ${textMutedClass}`}>Location</h4><p className={textSecondaryClass}>{location}</p></div></div> )}
                {memberSince && ( <div className="flex items-start space-x-3 py-2"><CalendarDays size={20} className={`mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} /><div><h4 className={`text-xs font-medium ${textMutedClass}`}>Member Since</h4><p className={textSecondaryClass}>{new Date(memberSince).toLocaleDateString()}</p></div></div> )}
                {websiteUrl && ( <div className="flex items-start space-x-3 py-2"><LinkIcon size={20} className={`mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} /><div><h4 className={`text-xs font-medium ${textMutedClass}`}>Website</h4><a href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} target="_blank" rel="noopener noreferrer" className={`${theme === 'dark' ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'} break-all`}>{websiteUrl}</a></div></div> )}
                {expertise && expertise.length > 0 && ( <div className={`md:col-span-2 flex items-start space-x-3 py-2 mt-2 pt-4 border-t ${borderClass}`}><Briefcase size={20} className={`mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} /><div><h4 className={`text-xs font-medium ${textMutedClass} mb-1.5`}>Expertise</h4><div className="flex flex-wrap gap-2">{expertise.map((exp, index) => (<span key={index} className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{exp}</span>))}</div></div></div> )}
                {certifications && certifications.length > 0 && ( <div className={`md:col-span-2 py-2 mt-2 pt-4 border-t ${borderClass}`}><Award size={20} className={`mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} /><div><h4 className={`text-xs font-medium ${textMutedClass} mb-2`}>Certifications</h4><ul className="space-y-2">{certifications.map((cert, index) => (<li key={index} className={`text-sm ${textSecondaryClass}`}>{cert}</li>))}</ul></div></div> )}
            </div>

            {userListings.length > 0 && ( <div> <h2 className={`text-2xl font-semibold ${textPrimaryClass} mt-8 mb-4`}>Active Listings ({userListings.length})</h2> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {userListings.map(battery => { const metrics = calculateMetrics(battery); const idKey = battery.batteryId || battery.id; return ( <div key={idKey} className={`${cardBgClass} rounded-lg shadow border ${borderClass} overflow-hidden flex flex-col justify-between transition-all duration-300 ease-in-out ${hoverCardClass}`}> <div className="p-5"> <h3 className={`text-lg font-semibold ${textPrimaryClass} leading-tight truncate mb-1`} title={`${battery.manufacturer} ${battery.model}`}>{battery.manufacturer} {battery.model}</h3> <p className={`text-xs ${textMutedClass} mb-2 truncate`}>ID: {idKey}</p> <div className="grid grid-cols-2 gap-2 text-sm my-2"> <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-1.5 rounded-md`}><p className={`${textMutedClass} text-xs`}>SoH</p><p className={`${textPrimaryClass} font-medium`}>{metrics.stateOfHealth === 'N/A' ? 'N/A' : `${metrics.stateOfHealth}%`}</p></div> <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-1.5 rounded-md`}><p className={`${textMutedClass} text-xs`}>Price</p><p className={`${textPrimaryClass} font-medium`}>{metrics.listingPriceString}</p></div> </div> <p className={`text-xs ${textSecondaryClass} h-10 overflow-y-auto line-clamp-2`}>{battery.listingDescription || 'No description provided.'}</p> </div> {onViewBatteryDetails && ( <div className={`p-3 border-t ${borderClass} ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50/50'}`}> <button onClick={() => onViewBatteryDetails(battery)} className={`${secondaryButtonClass} w-full text-xs py-1.5`}>View Full Listing</button> </div> )} </div> ); })} </div> </div> )}
      
            <div> <h2 className={`text-2xl font-semibold ${textPrimaryClass} mt-8 mb-4`}>Reviews ({reviews.length})</h2> <div className={`${cardBgClass} rounded-lg shadow p-6`}> {reviews.length > 0 ? ( <ReviewList reviews={reviews} theme={theme} onViewUserProfile={onNavigateToUserProfile} /> ) : ( <p className={textSecondaryClass}>This user has not received any reviews yet.</p> )} </div> </div>

            {profileData && !isOwnProfile && currentUser && ( <ReviewForm isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} theme={theme} currentUser={currentUser} revieweeId={userId} revieweeName={profileData.name || profileData.username} batteryId={null} showAppNotification={showAppNotification} onReviewSubmitted={handleReviewSubmitted} /> )}
    
            {showDeleteConfirmModal && isOwnProfile && ( <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"> <div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-md w-full`}> <div className="flex items-start justify-between mb-4"> <div className="flex items-center"> <AlertTriangle className={`mr-3 flex-shrink-0 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} size={24} /> <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>Delete Account</h3> </div> <button onClick={() => setShowDeleteConfirmModal(false)} disabled={isDeletingAccount} className={`p-1 rounded-full ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-200'}`} aria-label="Close modal" > <XCircle size={22} /> </button> </div> <p className={`${textSecondaryClass} mb-1`}>Are you absolutely sure you want to delete your account?</p> <p className={`${textMutedClass} text-sm mb-6`}>This action cannot be undone. All of your data may be permanently removed.</p> <div className="flex justify-end space-x-3"> <button onClick={() => setShowDeleteConfirmModal(false)} className={secondaryButtonClass} disabled={isDeletingAccount} > Cancel </button> <button onClick={handleConfirmAccountDeletion} className={`${destructiveConfirmButtonClass} flex items-center`} disabled={isDeletingAccount} > {isDeletingAccount ? <Loader2 size={18} className="animate-spin mr-2"/> : <Trash2 size={16} className="mr-2"/>} {isDeletingAccount ? 'Deleting...' : 'Delete My Account'} </button> </div> </div> </div> )}
      
            <FollowListModal isOpen={showFollowListModal} onClose={closeFollowListModal} title={followListTitle} users={followListUsers} theme={theme} onNavigateToUserProfile={onNavigateToUserProfile} isLoading={isFollowListLoading} />
        </div>
    );
}