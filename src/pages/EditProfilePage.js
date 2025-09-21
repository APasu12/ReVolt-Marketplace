// src/EditProfilePage.js
import React, { useState, useEffect, useCallback, useContext } from 'react'; // Added useContext
import axios from 'axios';
import { Save, UserCircle, Briefcase, MapPin, Link as LinkIcon, Award as AwardIcon, Type } from 'lucide-react';
import UserAvatar from './UserAvatar';
import AuthContext from './context/AuthContext'; // Import AuthContext

const API_BASE_URL = process.env.REACT_APP_API_URL; // Consistent with other frontend files

const initialFormState = {
  name: '',
  username: '', // Display only, not editable by user
  initials: '',
  profileDescription: '', // Changed from bio to match your model
  location: '',
  sellerType: 'Individual',
  companyName: '',
  websiteUrl: '',
  expertise: [], // Array of strings
  certifications: [], // Array of strings, as per your model DataTypes.ARRAY(DataTypes.TEXT)
  profilePictureUrl: '',
};

export default function EditProfilePage({ theme, showAppNotification, onProfileUpdated }) {
  const { currentUser, token } = useContext(AuthContext); // Get currentUser and token from AuthContext
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // For backend validation errors
  const [currentExpertiseInput, setCurrentExpertiseInput] = useState('');
  const [currentCertificationInput, setCurrentCertificationInput] = useState(''); // For single string input

  // Theme classes
  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400'; // Defined
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
  const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
  const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;
  const secondaryButtonClass = `px-3 py-1.5 text-xs border rounded-md transition-colors ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  const fetchProfile = useCallback(async () => {
    if (!currentUser || !currentUser.id || !token) {
      if (showAppNotification) showAppNotification("Cannot fetch profile. User not authenticated.", "error");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch own profile using /api/profile/me (as per your profileRoutes.js and authMiddleware)
      const response = await axios.get(`${API_BASE_URL}/api/profile/me`); // Axios default header includes token
      const profile = response.data;
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        initials: profile.initials || '',
        profileDescription: profile.profileDescription || profile.bio || '', // Use profileDescription or bio if available
        location: profile.location || '',
        sellerType: profile.sellerType || 'Individual',
        companyName: profile.companyName || '',
        websiteUrl: profile.websiteUrl || '',
        expertise: Array.isArray(profile.expertise) ? profile.expertise : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        profilePictureUrl: profile.profilePictureUrl || '',
      });
    } catch (error) {
      console.error("Error fetching profile for editing:", error.response?.data || error.message);
      if (showAppNotification) showAppNotification(error.response?.data?.msg || "Could not load your profile for editing.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, token, showAppNotification]); // API_BASE_URL is module const

  useEffect(() => {
    if (currentUser && currentUser.id && token) {
      fetchProfile();
    } else {
      setIsLoading(false); // Not loading if no user or token
    }
  }, [fetchProfile, currentUser, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddExpertise = () => {
    if (currentExpertiseInput.trim() && !formData.expertise.includes(currentExpertiseInput.trim())) {
      setFormData(prev => ({ ...prev, expertise: [...prev.expertise, currentExpertiseInput.trim()] }));
      setCurrentExpertiseInput('');
    }
  };
  const handleRemoveExpertise = (expToRemove) => {
    setFormData(prev => ({ ...prev, expertise: prev.expertise.filter(exp => exp !== expToRemove) }));
  };

  const handleAddCertification = () => {
    if (currentCertificationInput.trim() && !formData.certifications.includes(currentCertificationInput.trim())) {
      setFormData(prev => ({ ...prev, certifications: [...prev.certifications, currentCertificationInput.trim()] }));
      setCurrentCertificationInput('');
    } else if (!currentCertificationInput.trim()) {
        if (showAppNotification) showAppNotification("Please enter certification text.", "info");
    }
  };
  const handleRemoveCertification = (certToRemove) => {
     setFormData(prev => ({ ...prev, certifications: prev.certifications.filter(cert => cert !== certToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) {
        if (showAppNotification) showAppNotification("Authentication required to save profile.", "error");
        return;
    }
    setIsLoading(true);
    setFormErrors({});

    const profileDataToSubmit = {
      name: formData.name,
      initials: formData.initials,
      // profilePictureUrl: formData.profilePictureUrl, // Handle actual file upload separately
      bio: formData.profileDescription, // Ensure field name matches backend ('bio' or 'profileDescription')
      location: formData.location,
      sellerType: formData.sellerType,
      companyName: formData.companyName,
      websiteUrl: formData.websiteUrl,
      expertise: formData.expertise,
      certifications: formData.certifications,
    };
    // Username is generally not updatable here.

    try {
      // PUT to /api/profile/me (as per your profileRoutes.js)
      // Axios default header should include the token from AuthContext
      await axios.put(`${API_BASE_URL}/api/profile/me`, profileDataToSubmit);
      if (showAppNotification) showAppNotification("Profile updated successfully!", "success");
      if (onProfileUpdated) onProfileUpdated(); // Callback to parent (e.g., MainAppLayout to refresh user or navigate)
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.errors?.map(err => err.msg || err.message).join(', ') ||
                       error.response?.data?.msg ||
                       "Failed to update profile.";
      if (showAppNotification) showAppNotification(errorMsg, "error");
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param || err.path || 'general'] = err.msg || err.message;
        });
        setFormErrors(backendErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser && !isLoading) { // Check after loading attempt
    return (
        <div className={`${cardBgClass} rounded-lg shadow-xl p-6 md:p-8 text-center`}>
            <p className={textSecondaryClass}>Please log in to edit your profile.</p>
        </div>
    );
  }
  if (isLoading && !formData.username) {
     return (
        <div className={`${cardBgClass} rounded-lg shadow-xl p-6 md:p-8 text-center`}>
            <p className={textSecondaryClass}>Loading profile for editing...</p>
        </div>
    );
  }

  return (
    <div className={`${cardBgClass} rounded-lg shadow-xl p-6 md:p-8`}>
      <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-6 flex items-center`}>
        <UserCircle size={28} className="mr-3" /> Edit Your Profile
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Full Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="Your full name"/>
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="initials" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Initials (Max 3 chars)</label>
            <input type="text" name="initials" id="initials" value={formData.initials} onChange={handleChange} maxLength="3" className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="e.g. AV"/>
            {formErrors.initials && <p className="text-red-500 text-xs mt-1">{formErrors.initials}</p>}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="username" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Username (Display Only)</label>
            <input type="text" name="username" id="username" value={formData.username} readOnly className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} bg-opacity-50 italic cursor-not-allowed`} />
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className={`p-4 rounded-md border ${borderClass}`}>
            <label className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>Profile Picture</label>
            <div className="flex items-center gap-4">
                <UserAvatar user={{profilePictureUrl: formData.profilePictureUrl, name: formData.name, initials: formData.initials }} size="lg" theme={theme} />
                {/* <input type="file" onChange={(e) => setProfilePictureFile(e.target.files[0])} className={`text-sm ${textSecondaryClass}`}/> */}
                <p className={`text-sm ${textMutedClass}`}>Profile picture direct upload coming soon. For now, you can paste a URL below.</p>
            </div>
            <div className="mt-2">
                <label htmlFor="profilePictureUrl" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Profile Picture URL</label>
                <input type="url" name="profilePictureUrl" id="profilePictureUrl" value={formData.profilePictureUrl} onChange={handleChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="https://example.com/image.png"/>
                {formErrors.profilePictureUrl && <p className="text-red-500 text-xs mt-1">{formErrors.profilePictureUrl}</p>}
            </div>
        </div>

        <div>
          <label htmlFor="profileDescription" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Bio / Profile Description</label>
          <textarea name="profileDescription" id="profileDescription" value={formData.profileDescription} onChange={handleChange} rows="4" className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="Tell us a bit about yourself or your company..."></textarea>
          {formErrors.profileDescription && <p className="text-red-500 text-xs mt-1">{formErrors.profileDescription}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="location" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Location (City, Country)</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="e.g. San Francisco, USA"/>
            {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
          </div>
           <div>
            <label htmlFor="websiteUrl" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Website URL (Optional)</label>
            <input type="url" name="websiteUrl" id="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="https://your-website.com"/>
            {formErrors.websiteUrl && <p className="text-red-500 text-xs mt-1">{formErrors.websiteUrl}</p>}
          </div>
        </div>

         <div className={`p-4 rounded-md border ${borderClass}`}>
            <h3 className={`text-lg font-medium ${textPrimaryClass} mb-3`}>Seller Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="sellerType" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>I identify as a/an:</label>
                    <select name="sellerType" id="sellerType" value={formData.sellerType} onChange={handleChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}>
                        <option value="Not Specified">Not Specified</option>
                        <option value="Individual">Individual</option>
                        <option value="Commercial">Commercial Entity / Business</option>
                        <option value="Certified Refurbisher">Certified Refurbisher</option>
                        <option value="Other">Other</option>
                    </select>
                    {formErrors.sellerType && <p className="text-red-500 text-xs mt-1">{formErrors.sellerType}</p>}
                </div>
                {formData.sellerType && formData.sellerType !== 'Individual' && formData.sellerType !== 'Not Specified' && (
                     <div>
                        <label htmlFor="companyName" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Company Name</label>
                        <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} placeholder="Your company's name"/>
                        {formErrors.companyName && <p className="text-red-500 text-xs mt-1">{formErrors.companyName}</p>}
                    </div>
                )}
            </div>
        </div>

        <div className={`p-4 rounded-md border ${borderClass}`}>
            <label className={`block text-lg font-medium mb-2 ${textPrimaryClass}`}>Areas of Expertise (comma-separated or add one by one)</label>
            <div className="flex items-center gap-2 mb-3">
                <Briefcase size={20} className={`mr-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}/>
                <input type="text" value={currentExpertiseInput} onChange={(e) => setCurrentExpertiseInput(e.target.value)} placeholder="e.g. LiFePO4 Systems, Solar Integration" className={`flex-grow p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}/>
                <button type="button" onClick={handleAddExpertise} className={secondaryButtonClass}>Add</button>
            </div>
            {formErrors.expertise && <p className="text-red-500 text-xs mb-2">{formErrors.expertise}</p>}
            <div className="flex flex-wrap gap-2">
                {formData.expertise.map(exp => (
                    <span key={exp} className={`flex items-center text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-gray-200 text-gray-700'}`}>
                        {exp} <button type="button" onClick={() => handleRemoveExpertise(exp)} className="ml-1.5 text-red-500 hover:text-red-400">&times;</button>
                    </span>
                ))}
            </div>
        </div>

        <div className={`p-4 rounded-md border ${borderClass}`}>
             <label className={`block text-lg font-medium mb-3 ${textPrimaryClass}`}>Certifications (add one by one)</label>
             <div className="flex items-center gap-2 mb-3">
                <AwardIcon size={20} className={`mr-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}/>
                <input type="text" value={currentCertificationInput} onChange={(e) => setCurrentCertificationInput(e.target.value)} placeholder="e.g., Certified Battery Technician - Level II" className={`flex-grow p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}/>
                <button type="button" onClick={handleAddCertification} className={secondaryButtonClass}>Add Certification</button>
             </div>
            {formErrors.certifications && <p className="text-red-500 text-xs mb-2">{formErrors.certifications}</p>}
            {formData.certifications.length > 0 && <h4 className={`text-sm font-medium ${textSecondaryClass} mb-2 mt-2`}>Your Certifications:</h4>}
            <div className="space-y-2">
                {formData.certifications.map((cert, index) => (
                    <div key={index} className={`flex justify-between items-center text-xs p-2 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        <span className={textPrimaryClass}>{cert}</span>
                        <button type="button" onClick={() => handleRemoveCertification(cert)} className="text-red-500 hover:text-red-400 text-sm">&times;</button>
                    </div>
                ))}
            </div>
        </div>

        {formErrors.general && <p className="text-red-500 text-sm text-center py-2">{formErrors.general}</p>}
        <div className={`pt-6 border-t ${borderClass} flex justify-end`}>
          <button type="submit" className={`${primaryButtonClass} flex items-center`} disabled={isLoading}>
            <Save size={18} className="mr-2"/> {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}