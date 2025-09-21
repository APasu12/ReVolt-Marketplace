// Updated: src/MyListingsOffersPage.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
import UserAvatar from './UserAvatar';
import {
    Briefcase, CheckCircle, DollarSign, XCircle, AlertTriangle,
    Loader2, Inbox, Tag, HelpCircle, CornerDownLeft, CornerUpRight, Eye, TrendingUp
} from 'lucide-react'; // Removed MessageSquare as it wasn't used for a button

const API_URL = process.env.REACT_APP_API_URL;

const OfferStatusBadge = ({ status, theme }) => {
    let bgColor, Icon;
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
        case 'pending':
            bgColor = theme === 'dark' ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-100 text-yellow-700';
            Icon = Loader2;
            break;
        case 'accepted':
            bgColor = theme === 'dark' ? 'bg-green-600 text-green-100' : 'bg-green-100 text-green-700';
            Icon = CheckCircle;
            break;
        case 'rejected':
            bgColor = theme === 'dark' ? 'bg-red-600 text-red-100' : 'bg-red-100 text-red-700';
            Icon = XCircle;
            break;
        case 'withdrawn':
            bgColor = theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-gray-300 text-gray-600';
            Icon = CornerDownLeft;
            break;
        case 'superseded':
            bgColor = theme === 'dark' ? 'bg-purple-600 text-purple-200' : 'bg-purple-200 text-purple-700';
            Icon = AlertTriangle;
            break;
        default:
            bgColor = theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';
            Icon = HelpCircle;
    }
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center ${bgColor}`}>
            {Icon && <Icon size={12} className={`mr-1.5 ${lowerStatus === 'pending' ? 'animate-spin' : ''}`} />}
            {status}
        </span>
    );
};


export default function MyListingsOffersPage({
  theme,
  showAppNotification,
  onNavigateToUserProfile,
  onNavigateToBattery // Prop to navigate to battery details (e.g., passed from MainAppLayout)
}) {
  const { currentUser, token } = useContext(AuthContext);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [madeOffers, setMadeOffers] = useState([]);
  const [isLoadingReceived, setIsLoadingReceived] = useState(true);
  const [isLoadingMade, setIsLoadingMade] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received');

  const [actioningOfferDetails, setActioningOfferDetails] = useState({ id: null, type: null });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    message: '',
    onConfirm: () => {},
    actionLabel: '',
    actionType: ''
  });

  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-600';
  const tabButtonBase = `px-4 py-2.5 text-sm font-medium rounded-t-md focus:outline-none transition-colors duration-150`;
  const tabButtonActive = theme === 'dark' ? `bg-slate-800 text-blue-400 border-b-2 border-blue-400` : `bg-white text-blue-600 border-b-2 border-blue-600`;
  const tabButtonInactive = theme === 'dark' ? `text-slate-400 hover:text-slate-200 hover:bg-slate-700/50` : `text-gray-500 hover:text-gray-700 hover:bg-gray-100`;
  const actionButtonBase = `px-3 py-1.5 text-xs font-medium rounded-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;
  const acceptButtonClass = `${actionButtonBase} ${theme === 'dark' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`;
  const rejectButtonClass = `${actionButtonBase} ${theme === 'dark' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`;
  const withdrawButtonClass = `${actionButtonBase} ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`;
  const secondaryButtonClass = `${actionButtonBase} border ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const disabledButtonClass = `opacity-50 cursor-not-allowed`; // Added this definition


  const fetchReceivedOffers = useCallback(async () => {
    if (!token || !currentUser) { setError("Authentication required."); setIsLoadingReceived(false); return; }
    setIsLoadingReceived(true); setError(null);
    try {
        const response = await axios.get(`${API_URL}/api/offers/received`, { headers: { Authorization: `Bearer ${token}` } });
        setReceivedOffers(response.data || []);
    } catch (err) {
        console.error("Fetch Received Offers Error:", err.response?.data || err.message);
        const errorMsg = err.response?.data?.msg || "Could not load received offers.";
        setError(errorMsg);
        if (showAppNotification) showAppNotification(errorMsg, "error");
        setReceivedOffers([]); // Ensure it's an array on error
    } finally { setIsLoadingReceived(false); }
  }, [token, currentUser, showAppNotification]);

  const fetchMadeOffers = useCallback(async () => {
    if (!token || !currentUser) { setError("Authentication required."); setIsLoadingMade(false); return;}
    setIsLoadingMade(true); setError(null);
    try {
        const response = await axios.get(`${API_URL}/api/offers/made`, { headers: { Authorization: `Bearer ${token}` } });
        setMadeOffers(response.data || []);
    } catch (err) {
        console.error("Fetch Made Offers Error:", err.response?.data || err.message);
        const errorMsg = err.response?.data?.msg || "Could not load offers you've made.";
        setError(errorMsg);
        if (showAppNotification) showAppNotification(errorMsg, "error");
        setMadeOffers([]); // Ensure it's an array on error
    } finally { setIsLoadingMade(false); }
  }, [token, currentUser, showAppNotification]);

  useEffect(() => {
    if (activeTab === 'received') {
      fetchReceivedOffers();
    } else if (activeTab === 'made') {
      fetchMadeOffers();
    }
  }, [activeTab, fetchReceivedOffers, fetchMadeOffers]);

  const openConfirmationModal = (offer, actionType) => {
    const actionText = actionType.charAt(0).toUpperCase() + actionType.slice(1);
    const batteryInfo = offer.batteryOfferedOn ? `${offer.batteryOfferedOn.manufacturer} ${offer.batteryOfferedOn.model}` : 'the item';
    const buyerName = offer.buyer?.name || offer.buyer?.username || 'the buyer';
    let message = `Are you sure you want to ${actionType.toLowerCase()} this offer?`;

    if (actionType === 'accept' || actionType === 'reject') {
        message = `Are you sure you want to ${actionType.toLowerCase()} the offer of $${parseFloat(offer.offerAmount).toLocaleString()} from ${buyerName} for ${batteryInfo}?`;
        if (actionType === 'accept') message += " Other pending offers for this item may be affected.";
    } else if (actionType === 'withdraw') {
        message = `Are you sure you want to withdraw your offer of $${parseFloat(offer.offerAmount).toLocaleString()} for ${batteryInfo}?`;
    }

    setConfirmModalProps({
      message,
      onConfirm: () => executeOfferAction(offer.offerId, actionType),
      actionLabel: actionText,
      actionType
    });
    setShowConfirmModal(true);
  };

  const executeOfferAction = async (offerId, offerActionType) => {
    if (!token) { if (showAppNotification) showAppNotification("Authentication required.", "error"); setShowConfirmModal(false); return; }
    
    setActioningOfferDetails({ id: offerId, type: offerActionType });
    setShowConfirmModal(false);
    let endpoint = '';
    let method = 'put';
    let payload = {};

    if (offerActionType === 'accept' || offerActionType === 'reject') {
        endpoint = `${API_URL}/api/offers/${offerId}/status`;
        payload = { status: offerActionType };
    } else if (offerActionType === 'withdraw') {
        endpoint = `${API_URL}/api/offers/${offerId}/withdraw`;
    } else {
        if(showAppNotification) showAppNotification("Invalid action type.", "error");
        setActioningOfferDetails({ id: null, type: null });
        return;
    }

    try {
      await axios({ method, url: endpoint, data: payload, headers: { Authorization: `Bearer ${token}` } });
      const successMessage = `Offer successfully ${offerActionType === 'accept' ? 'accepted' : (offerActionType === 'reject' ? 'rejected' : 'withdrawn')}!`;
      if(showAppNotification) showAppNotification(successMessage, "success", 5000);

      if (activeTab === 'received') {
        fetchReceivedOffers();
      } else {
        fetchMadeOffers();
      }
    } catch (err) {
      console.error(`Failed to ${offerActionType} offer:`, err.response?.data || err.message);
      if(showAppNotification) showAppNotification(err.response?.data?.msg || `Could not ${offerActionType} offer. Please try again.`, "error");
    } finally {
      setActioningOfferDetails({ id: null, type: null });
    }
  };

  const handleNavigateToBatteryDetails = (battery) => {
    if(onNavigateToBattery && battery && battery.batteryId) {
        onNavigateToBattery(battery);
    } else if (showAppNotification){
        showAppNotification("Battery details are not available for this item.", "warning");
    }
  };

  const renderOffersList = (offersToRender, type) => {
    if (!Array.isArray(offersToRender) || offersToRender.length === 0) { // Added Array.isArray check
      return (
        <div className="p-10 text-center">
          <Inbox size={48} className={`mx-auto mb-4 ${textMutedClass}`} />
          <p className={`text-lg font-semibold ${textPrimaryClass} mb-2`}>
            No {type === 'received' ? 'offers received' : "offers made"} yet.
          </p>
          {type === 'made' && <p className={textSecondaryClass}>Browse the marketplace to make offers on battery listings.</p>}
          {type === 'received' && <p className={textSecondaryClass}>When buyers make offers on your listings, they will appear here.</p>}
        </div>
      );
    }
    return (
      <div className="space-y-4 py-4">
        {offersToRender.map(offer => {
          const targetUser = type === 'received' ? offer.buyer : offer.seller;
          const battery = offer.batteryOfferedOn;
          const isActionInProgress = actioningOfferDetails.id === offer.offerId && actioningOfferDetails.type === actioningOfferDetails.type;
          
          return (
            <div key={offer.offerId} className={`${cardBgClass} p-4 rounded-lg border ${borderClass} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                <div className="flex-grow space-y-2">
                  {battery && (
                    <div className="flex items-center space-x-2">
                        <Tag size={16} className={`${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />
                        <span className={`text-sm font-medium ${textPrimaryClass}`}>
                            Offer for: {}
                            <button 
                                onClick={() => battery && handleNavigateToBatteryDetails(battery)} 
                                className={`ml-1 ${theme==='dark'?'text-blue-400 hover:text-blue-300':'text-blue-600 hover:text-blue-700'} underline focus:outline-none`}
                                title={`View Listing: ${battery.manufacturer} ${battery.model}`}
                                disabled={!onNavigateToBattery}
                            >
                                {battery.manufacturer} {battery.model}
                            </button>
                        </span>
                    </div>
                  )}
                   <p className={`text-xl font-bold ${textPrimaryClass} flex items-center`}>
                    <DollarSign size={22} className="mr-1" />{parseFloat(offer.offerAmount).toLocaleString()}
                  </p>
                  <OfferStatusBadge status={offer.status} theme={theme} />
                  {offer.message && (
                    <p className={`text-sm italic ${textMutedClass} mt-1 border-l-2 ${borderClass} pl-2 py-1`}>"{offer.message}"</p>
                  )}
                  <p className={`text-xs ${textMutedClass}`}>
                    {type === 'received' ? 'Offer Received:' : 'Offer Made:'} {new Date(offer.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex-shrink-0 flex flex-col sm:items-end space-y-3 w-full sm:w-auto pt-2 sm:pt-0">
                    <div className="flex items-center space-x-3 justify-start sm:justify-end w-full">
                        <UserAvatar user={targetUser} theme={theme} size="md" />
                        <div>
                        <p className={`text-xs ${textMutedClass}`}>{type === 'received' ? 'From Buyer:' : 'To Seller:'}</p>
                        <button
                            onClick={() => targetUser && onNavigateToUserProfile && onNavigateToUserProfile(targetUser.userId)}
                            className={`font-semibold ${textPrimaryClass} hover:underline text-sm focus:outline-none`}
                            title={`View profile of ${targetUser?.name || targetUser?.username}`}
                            disabled={!onNavigateToUserProfile}
                        >
                            {targetUser?.name || targetUser?.username || 'User'}
                        </button>
                        </div>
                    </div>
                  
                  <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 w-full items-stretch">
                    {type === 'received' && offer.status === 'pending' && battery?.isListedForMarketplace && (
                      <>
                        <button onClick={() => openConfirmationModal(offer, 'accept')} className={`${acceptButtonClass} flex-1 sm:w-full ${isActionInProgress && actioningOfferDetails.type === 'accept' ? disabledButtonClass : ''}`} disabled={isActionInProgress}>
                          {isActionInProgress && actioningOfferDetails.type === 'accept' ? <Loader2 size={14} className="animate-spin mr-1.5"/> : <CheckCircle size={14} className="mr-1.5"/>} Accept
                        </button>
                        <button onClick={() => openConfirmationModal(offer, 'reject')} className={`${rejectButtonClass} flex-1 sm:w-full ${isActionInProgress && actioningOfferDetails.type === 'reject' ? disabledButtonClass : ''}`} disabled={isActionInProgress}>
                          {isActionInProgress && actioningOfferDetails.type === 'reject' ? <Loader2 size={14} className="animate-spin mr-1.5"/> : <XCircle size={14} className="mr-1.5"/>} Reject
                        </button>
                      </>
                    )}
                    {type === 'made' && offer.status === 'pending' && (
                      <button onClick={() => openConfirmationModal(offer, 'withdraw')} className={`${withdrawButtonClass} flex-1 sm:w-full ${isActionInProgress && actioningOfferDetails.type === 'withdraw' ? disabledButtonClass : ''}`} disabled={isActionInProgress}>
                        {isActionInProgress && actioningOfferDetails.type === 'withdraw' ? <Loader2 size={14} className="animate-spin mr-1.5"/> : <CornerDownLeft size={14} className="mr-1.5"/>} Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-center space-x-3 mb-6 sticky top-0 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'} py-3 z-10 -mx-4 px-4 md:-mx-6 md:px-6 shadow-sm`}>
        <Briefcase size={28} className={textPrimaryClass} />
        <h1 className={`text-2xl font-bold ${textPrimaryClass}`}>My Offers Dashboard</h1>
      </div>

      <div className={`border-b ${borderClass} flex`}>
        <button
          onClick={() => setActiveTab('received')}
          className={`${tabButtonBase} ${activeTab === 'received' ? tabButtonActive : tabButtonInactive} flex-1 justify-center flex items-center`}
        >
          <CornerUpRight size={16} className="mr-2"/> Offers Received ({receivedOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('made')}
          className={`${tabButtonBase} ${activeTab === 'made' ? tabButtonActive : tabButtonInactive} flex-1 justify-center flex items-center`}
        >
          <TrendingUp size={16} className="mr-2"/> My Sent Offers ({madeOffers.length})
        </button>
      </div>

      {error && !isLoadingMade && !isLoadingReceived && ( // Show error only if not loading
        <div className={`p-4 rounded-md text-center ${theme === 'dark' ? 'bg-red-800/30 text-red-300' : 'bg-red-100 text-red-700'} border ${theme === 'dark' ? 'border-red-700' : 'border-red-300'}`}>
          <AlertTriangle size={20} className="inline mr-2" /> {error}
        </div>
      )}

      {activeTab === 'received' && (isLoadingReceived ? <div className="flex justify-center items-center py-10"><Loader2 size={32} className={`${textMutedClass} animate-spin`} /> <span className={`${textSecondaryClass} ml-3`}>Loading Received Offers...</span></div> : renderOffersList(receivedOffers, 'received'))}
      {activeTab === 'made' && (isLoadingMade ? <div className="flex justify-center items-center py-10"><Loader2 size={32} className={`${textMutedClass} animate-spin`} /> <span className={`${textSecondaryClass} ml-3`}>Loading Sent Offers...</span></div> : renderOffersList(madeOffers, 'made'))}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-md w-full`}>
            <h3 className={`text-lg font-semibold ${textPrimaryClass} mb-4 flex items-center`}>
                <AlertTriangle className={`mr-2 ${confirmModalProps.actionType === 'accept' ? (theme === 'dark' ? 'text-green-400':'text-green-500') : ((confirmModalProps.actionType === 'reject' || confirmModalProps.actionType === 'withdraw') ? (theme === 'dark' ? 'text-red-400':'text-red-500') : textSecondaryClass)}`} />
                Confirm Action: {confirmModalProps.actionLabel} Offer
            </h3>
            <p className={`${textSecondaryClass} mb-6 text-sm`}>{confirmModalProps.message}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirmModal(false)} className={`${secondaryButtonClass} px-4 py-2`} disabled={actioningOfferDetails.id !== null}>Cancel</button>
              <button
                onClick={confirmModalProps.onConfirm}
                className={`${confirmModalProps.actionType === 'accept' ? acceptButtonClass : (confirmModalProps.actionType === 'reject' ? rejectButtonClass : withdrawButtonClass)} px-4 py-2 ${actioningOfferDetails.id !== null ? disabledButtonClass : ''}`} // Use defined disabledButtonClass
                disabled={actioningOfferDetails.id !== null}
              >
                {actioningOfferDetails.id !== null ? <Loader2 size={16} className="animate-spin mr-1.5"/> : null}
                {confirmModalProps.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}