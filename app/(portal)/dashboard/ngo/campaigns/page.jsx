
'use client';
import { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, uploadImage } from '@/lib/campaign';
import { PlusCircle, Search, Calendar, Clock, Users, MapPin } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    shortdesc: '',
    mission: '',
    date: '',
    time: '09:00',
    location: '',
    volunteers: '',
    image: '',
  });
  
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const campaignsData = await getCampaigns();
        setCampaigns(campaignsData);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.shortdesc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.mission?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCampaign({
      ...newCampaign,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Format the date and time
      const dateTimeString = `${newCampaign.date}T${newCampaign.time}:00`;
      const dateObj = new Date(dateTimeString);
      
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      // Create the campaign data object following your Firebase structure
      const campaignData = {
        date: dateObj,
        image: imageUrl,
        location: newCampaign.location,
        mission: newCampaign.mission,
        name: newCampaign.name,
        shortdesc: newCampaign.shortdesc,
        volunteers: parseInt(newCampaign.volunteers) || 0,
        requiredAmount: parseFloat(newCampaign.requiredAmount) || 0,
      };
      
      // Add to Firebase
      const docRef = await createCampaign(campaignData);
      
      // Add to local state with the ID
      const newCampaignWithId = {
        id: docRef.id,
        ...campaignData,
      };
      
      setCampaigns([...campaigns, newCampaignWithId]);
      
      // Reset form
      setNewCampaign({
        name: '',
        shortdesc: '',
        mission: '',
        date: '',
        time: '09:00',
        location: '',
        volunteers: '',
        image: '',
        requiredAmount: '',
      });
      setImageFile(null);
      setIsCreatingCampaign(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Campaigns</h1>
        <p className="text-gray-600">Join us in making a difference. Explore our current initiatives or create a new campaign.</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsCreatingCampaign(true)}
          className="flex items-center gap-2 bg-[#1CAC78] text-white px-4 py-2 rounded-lg hover:bg-[#1CAC78] transition-colors"
          disabled={loading}
        >
          <PlusCircle className="h-5 w-5" />
          <span>Create Campaign</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No campaigns found. Try a different search term or create a new campaign.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCampaignClick(campaign)}
            >
              <img 
                src={campaign.image || '/api/placeholder/600/300'} 
                alt={campaign.name} 
                className="w-full h-48 object-cover" 
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{campaign.name}</h3>
                <p className="text-gray-600 mb-4">{campaign.shortdesc}</p>
                <div className="flex flex-col gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(campaign.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(campaign.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{campaign.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{campaign.volunteers} Volunteers Needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Amount Needed: ₹{campaign.requiredAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
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
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Mission</h3>
                  <p>{selectedCampaign.mission}</p>
                </div>
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Required Amount: ₹{selectedCampaign.requiredAmount?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreatingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create New Campaign</h2>
                <button 
                  onClick={() => setIsCreatingCampaign(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateCampaign}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Campaign Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newCampaign.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={newCampaign.location}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newCampaign.date}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={newCampaign.time}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Volunteers Needed</label>
                    <input
                      type="number"
                      name="volunteers"
                      value={newCampaign.volunteers}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Campaign Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    name="shortdesc"
                    value={newCampaign.shortdesc}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-1">Mission</label>
                  <textarea
                    name="mission"
                    value={newCampaign.mission}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Required Amount (₹)</label>
                    <input
                    type="number"
                    name="requiredAmount"
                    value={newCampaign.requiredAmount}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                    required
                    />
                </div>
                
                <div className="flex justify-end gap-4 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingCampaign(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Campaign</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}