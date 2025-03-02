'use client';

import { useState, useEffect } from 'react';
import { getCampaigns, getCampaignById, updateCampaignRaisedAmount } from '@/lib/campaign';
import { Search, Calendar, Clock, Users, MapPin, DollarSign, Heart } from 'lucide-react';

// You'll need to create this function in your lib/donations.js
import { createDonation } from '@/lib/donations';

export default function UserCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const campaignsData = await getCampaigns();
      
      // Sort campaigns by date (newest first)
      campaignsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.shortdesc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.mission?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCampaignClick = async (campaign) => {
    // Get the latest campaign data to ensure we have the most up-to-date raised amount
    try {
      const updatedCampaign = await getCampaignById(campaign.id);
      setSelectedCampaign(updatedCampaign || campaign);
    } catch (error) {
      console.error("Error fetching updated campaign:", error);
      setSelectedCampaign(campaign);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const openDonateModal = (e, campaign) => {
    e.stopPropagation();
    // If clicked from the campaign card, fetch and set the selected campaign
    if (campaign && !selectedCampaign) {
      setSelectedCampaign(campaign);
    }
    setIsDonateModalOpen(true);
  };

  const closeDonateModal = () => {
    setIsDonateModalOpen(false);
    setDonationAmount('');
    setDonorName('');
    setDonorEmail('');
    setSuccessMessage('');
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const amount = parseFloat(donationAmount);
      
      // Create donation object
      const donationData = {
        campaignId: selectedCampaign.id,
        campaignName: selectedCampaign.name,
        amount: amount,
        donorName,
        donorEmail,
        timestamp: new Date(),
        status: 'completed'
      };
      
      // Send to Firebase
      await createDonation(donationData);
      
      // Update the raised amount for the campaign in Firebase
      const newRaisedAmount = (selectedCampaign.raisedAmount || 0) + amount;
      await updateCampaignRaisedAmount(selectedCampaign.id, newRaisedAmount);
      
      // Update the campaign locally
      const updatedCampaign = { ...selectedCampaign, raisedAmount: newRaisedAmount };
      setSelectedCampaign(updatedCampaign);
      
      // Update the campaigns list
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === selectedCampaign.id 
          ? { ...campaign, raisedAmount: newRaisedAmount }
          : campaign
      ));
      
      // Show success message
      setSuccessMessage('Thank you for your donation!');
      
      // Reset form (but don't close modal yet)
      setDonationAmount('');
      setDonorName('');
      setDonorEmail('');
      
      // After 3 seconds, close the modal
      setTimeout(() => {
        closeDonateModal();
        // Also close the campaign modal if the user wants to continue browsing
        closeModal();
        // Reload campaigns to get fresh data
        loadCampaigns();
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting donation:", error);
      alert("There was an error processing your donation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'TBD';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (date) => {
    if (!date) return 'TBD';
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleTimeString(undefined, options);
  };

  // Calculate progress percentage
  const calculateProgress = (campaign) => {
    if (!campaign.requiredAmount || campaign.requiredAmount === 0) return 0;
    const raisedAmount = campaign.raisedAmount || 0;
    const percentage = (raisedAmount / campaign.requiredAmount) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Check if campaign has reached or exceeded its goal
  const isGoalReached = (campaign) => {
    if (!campaign.requiredAmount || campaign.requiredAmount === 0) return false;
    const raisedAmount = campaign.raisedAmount || 0;
    return raisedAmount >= campaign.requiredAmount;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Support Our Campaigns</h1>
        <p className="text-gray-600">Browse and donate to our campaigns to help make a positive impact in our community.</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns by name, description, or location..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No campaigns found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCampaignClick(campaign)}
            >
              <div className="relative">
                <img 
                  src={campaign.image || '/api/placeholder/600/300'} 
                  alt={campaign.name} 
                  className="w-full h-48 object-cover" 
                />
                <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{campaign.name}</h3>
                <p className="text-gray-600 mb-4">{campaign.shortdesc}</p>
                
                {/* Funding Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">₹{campaign.raisedAmount || 0} raised</span>
                    <span className="text-gray-500">of ₹{campaign.requiredAmount || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${calculateProgress(campaign)}%` }}
                    ></div>
                  </div>
                  {isGoalReached(campaign) && (
                    <div className="text-green-600 text-sm mt-1 font-medium">Goal reached! Thank you for your support.</div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(campaign.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{campaign.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{campaign.volunteers} Volunteers Needed</span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => openDonateModal(e, campaign)}
                  className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isGoalReached(campaign) 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-[#1CAC78] text-white hover:bg-[#1CAC78]'
                  }`}
                  disabled={isGoalReached(campaign)}
                >
                  <span>{isGoalReached(campaign) ? 'Goal Reached' : 'Donate Now'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Details Modal */}
      {isModalOpen && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-90vh overflow-y-auto">
            <div className="relative">
              <img 
                src={selectedCampaign.image || '/api/placeholder/600/300'} 
                alt={selectedCampaign.name} 
                className="w-full h-64 object-cover" 
              />
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedCampaign.name}</h2>
              <p className="text-gray-600 mb-6">{selectedCampaign.shortdesc}</p>
              
              {/* Funding Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">₹{selectedCampaign.raisedAmount || 0} raised</span>
                  <span className="text-gray-500">Goal: ₹{selectedCampaign.requiredAmount || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ width: `${calculateProgress(selectedCampaign)}%` }}
                  ></div>
                </div>
                {isGoalReached(selectedCampaign) && (
                  <div className="text-green-600 text-sm mt-1 font-medium">Goal reached! Thank you for your support.</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Campaign Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span>Date: {formatDate(selectedCampaign.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span>Time: {formatTime(selectedCampaign.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <span>Location: {selectedCampaign.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span>Volunteers Needed: {selectedCampaign.volunteers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      <span>Required Amount: ₹{selectedCampaign.requiredAmount || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Mission</h3>
                  <p>{selectedCampaign.mission}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button 
                  onClick={(e) => openDonateModal(e)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    isGoalReached(selectedCampaign) 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-[#1CAC78] text-white hover:bg-[#1CAC78]'
                  }`}
                  disabled={isGoalReached(selectedCampaign)}
                >
                  <span>{isGoalReached(selectedCampaign) ? 'Goal Reached' : 'Donate Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {isDonateModalOpen && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Donate to {selectedCampaign.name}</h2>
                <button 
                  onClick={closeDonateModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {successMessage ? (
                <div className="text-center py-6">
                  <div className="mb-4 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{successMessage}</h3>
                  <p className="text-gray-600">Your contribution will help make a difference.</p>
                </div>
              ) : (
                <form onSubmit={handleDonationSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-1">Donation Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Suggested amounts */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[500, 1000, 5000, 10000, 50000].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setDonationAmount(amount.toString())}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          donationAmount === amount.toString() 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-1">Your Email</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#1CAC78] text-white rounded-lg hover:bg-[#1CAC78] transition-colors flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Donation</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}