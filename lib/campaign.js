import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Campaign collection reference
const campaignsCollection = collection(db, 'campaigns');

// Get all campaigns
export async function getCampaigns() {
  const snapshot = await getDocs(campaignsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
  }));
}

// Get campaign by ID
export async function getCampaignById(id) {
  const docRef = doc(db, 'campaigns', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate() || new Date(),
    };
  } else {
    return null;
  }
}

// Create a new campaign
export async function createCampaign(campaignData) {
  // Convert date string to Timestamp
  if (campaignData.date) {
    const dateObj = new Date(campaignData.date);
    campaignData.date = Timestamp.fromDate(dateObj);
  }
  
  // Add volunteers as a number
  if (campaignData.volunteers) {
    campaignData.volunteers = parseInt(campaignData.volunteers);
  }

  if (campaignData.requiredAmount) {
    campaignData.requiredAmount = parseFloat(campaignData.requiredAmount);
  }
  
  return await addDoc(campaignsCollection, campaignData);
}

// Upload image to Firebase Storage
export async function uploadImage(file) {
  const storageRef = ref(storage, `campaign-images/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}