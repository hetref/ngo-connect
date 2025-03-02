// lib/donations.js
'use client';

import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// Donations collection reference
const donationsCollection = collection(db, 'donations');

// Create a new donation
export async function createDonation(donationData) {
  // Convert date to Timestamp
  if (donationData.timestamp) {
    donationData.timestamp = Timestamp.fromDate(new Date(donationData.timestamp));
  }
  
  // Add the donation to Firestore
  const docRef = await addDoc(donationsCollection, donationData);
  
  // Update the campaign's raised amount
  await updateCampaignRaisedAmount(donationData.campaignId, donationData.amount);
  
  return docRef;
}

// Get donations by campaign ID
export async function getDonationsByCampaign(campaignId) {
  const q = query(donationsCollection, where("campaignId", "==", campaignId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  }));
}

// Get donations by donor email
export async function getDonationsByDonor(email) {
  const q = query(donationsCollection, where("donorEmail", "==", email));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  }));
}

// Get total donations for a campaign
export async function getCampaignTotalDonations(campaignId) {
  const donations = await getDonationsByCampaign(campaignId);
  
  return donations.reduce((total, donation) => {
    return total + (parseFloat(donation.amount) || 0);
  }, 0);
}

// Update campaign's raised amount
async function updateCampaignRaisedAmount(campaignId, donationAmount) {
  try {
    // Get current campaign data
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (campaignSnap.exists()) {
      const campaignData = campaignSnap.data();
      const currentRaisedAmount = campaignData.raisedAmount || 0;
      const newRaisedAmount = currentRaisedAmount + parseFloat(donationAmount);
      
      // Update the campaign with the new raised amount
      await updateDoc(campaignRef, {
        raisedAmount: newRaisedAmount
      });
    }
  } catch (error) {
    console.error("Error updating campaign raised amount:", error);
    // Still allow the donation to be recorded even if the update fails
  }
}

// Get donation by ID
export async function getDonationById(id) {
  const docRef = doc(db, 'donations', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    };
  } else {
    return null;
  }
}