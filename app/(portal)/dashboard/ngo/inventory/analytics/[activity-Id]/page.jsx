"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, MapPin, BarChart, AlertTriangle, FileText, Search, X, Trash2, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc, deleteDoc, arrayRemove, query, where, increment } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { use } from 'react'
import { Plus, Minus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/AuthContext"
import dynamic from "next/dynamic"
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Create a completely client-side PDF download component
const PDFDownloadButton = dynamic(
  () => import("@/components/reports/inventory/pdf-download-button").then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <Button className="bg-[#1CAC78] hover:bg-[#158f63]" disabled>
        <FileText className="mr-2 h-4 w-4" />
        Loading PDF Generator...
      </Button>
    )
  }
);

// Dynamic import for the PDF component
const InventoryReportPDF = dynamic(
  () => import("@/components/reports/inventory/inventory-report-pdf"),
  { ssr: false }
);

export default function NGOInventoryAnalyticsPage({ params }) {
  const { user: authUser } = useAuth()
  const unwrappedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [eventDetails, setEventDetails] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [donations, setDonations] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [availableProducts, setAvailableProducts] = useState([])
  const [resItems, setResItems] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [assignedQuantity, setAssignedQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [productToUpdate, setProductToUpdate] = useState(null)
  const [updatedQuantity, setUpdatedQuantity] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentProductDetails, setCurrentProductDetails] = useState(null)

  useEffect(() => {
    const fetchActivitiesAndInventory = async () => {
      if (!unwrappedParams['activity-Id']) {
        console.error("No activity ID provided");
        setLoading(false);
        return;
      }

      try {
        const activityDocRef = doc(db, "activities", unwrappedParams['activity-Id']);
        const activityDoc = await getDoc(activityDocRef);

        if (!activityDoc.exists()) {
          console.log("No activity found with ID:", unwrappedParams['activity-Id']);
          setLoading(false);
          return;
        }

        const activityData = activityDoc.data();
        setEventDetails(activityData);

        if (!activityData.inventory || !Array.isArray(activityData.inventory)) {
          console.log("No inventory data found");
          setLoading(false);
          return;
        }

        // Create a Set to track processed product IDs and avoid duplicates
        const processedIds = new Set();
        const inventoryPromises = [];

        // Process each inventory item
        activityData.inventory.forEach(item => {
          const productId = typeof item === 'string' ? item : item.productid;
          
          if (!productId) {
            console.log("No product ID for item:", item);
            return;
          }

          // Skip if this ID has already been processed
          if (processedIds.has(productId)) {
            console.log(`Skipping duplicate product ID: ${productId}`);
            return;
          }
          
          // Mark this ID as processed
          processedIds.add(productId);

          // Add the promise to fetch the item details
          inventoryPromises.push(new Promise(async (resolve) => {
            try {
              const inventoryDocRef = doc(db, "activities", unwrappedParams['activity-Id'], "inventory", productId);
              const inventoryDoc = await getDoc(inventoryDocRef);

              if (inventoryDoc.exists()) {
                const inventoryData = inventoryDoc.data();
                // Standardize fields regardless of whether it's a product or resource
                let standardizedItem = {
                  ...item,
                  ...inventoryData,
                  id: productId,
                  productid: productId,
                  category: inventoryData.category || "Uncategorized",
                  isResource: inventoryData.type === 'res',
                  itemType: inventoryData.type === 'res' ? 'Donation' : 'Product'
                };
                
                // For resources, properly set resource and resourceName fields
                if (inventoryData.type === 'res') {
                  standardizedItem.resource = inventoryData.resource || '';
                  standardizedItem.resourceName = inventoryData.resourceName || '';
                  standardizedItem.productname = inventoryData.resourceName || "Unnamed Donation";
                  standardizedItem.displayName = `${standardizedItem.resourceName || 'Unnamed Item'} (${standardizedItem.resource || 'General'})`;
                } else {
                  standardizedItem.productname = inventoryData.productname || "Unnamed Product";
                  standardizedItem.displayName = standardizedItem.productname;
                }
                
                resolve(standardizedItem);
              } else {
                console.log(`No details found for product ${productId}`);
                resolve(null);
              }
            } catch (error) {
              console.error(`Error fetching inventory item ${productId}:`, error);
              resolve(null);
            }
          }));
        });

        const detailedInventory = (await Promise.all(inventoryPromises)).filter(item => item !== null);
        console.log("Loaded inventory items:", detailedInventory.length);
        setInventoryItems(detailedInventory);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivitiesAndInventory();
  }, [unwrappedParams]);

  useEffect(() => {
    const fetchProductsAndRes = async () => {
      try {
        // Fetch products
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        const products = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'product',
          productName: doc.data().productName || doc.data().name,
          category: doc.data().category || 'Uncategorized',
          quantity: doc.data().quantity || 0,
          ...doc.data()
        }));

        // Fetch res collection
        const resCollection = collection(db, "res");
        const resSnapshot = await getDocs(resCollection);
        const resItems = resSnapshot.docs.map(doc => {
          const data = doc.data();
          // Calculate actual available quantity for donations
          const quantity = data.remaining || 0;
          return {
            id: doc.id,
            type: 'res',
            productName: data.resource || data.productname,
            category: data.category || 'Uncategorized',
            quantity: quantity, // Use remaining as the quantity
            remaining: quantity,
            ...data
          };
        });

        // Combine similar items
        const combinedItems = new Map();
        
        // Process products first
        products.forEach(product => {
          const key = product.productName.toLowerCase();
          if (!combinedItems.has(key)) {
            combinedItems.set(key, {
              ...product,
              sources: [{ type: 'product', id: product.id, quantity: product.quantity }]
            });
          } else {
            const existing = combinedItems.get(key);
            existing.quantity += product.quantity;
            existing.sources.push({ type: 'product', id: product.id, quantity: product.quantity });
          }
        });

        // Then process res items and combine with products if needed
        resItems.forEach(item => {
          const key = item.productName.toLowerCase();
          if (!combinedItems.has(key)) {
            combinedItems.set(key, {
              ...item,
              sources: [{ type: 'res', id: item.id, quantity: item.remaining }]
            });
          } else {
            const existing = combinedItems.get(key);
            existing.quantity += item.remaining;
            existing.sources.push({ type: 'res', id: item.id, quantity: item.remaining });
          }
        });

        setAvailableProducts(Array.from(combinedItems.values()).filter(item => !item.sources.every(s => s.type === 'res')));
        setResItems(Array.from(combinedItems.values()).filter(item => !item.sources.every(s => s.type === 'product')));
      } catch (error) {
        console.error("Error fetching products and res:", error);
      }
    };

    if (isDialogOpen) fetchProductsAndRes();
  }, [isDialogOpen]);

  useEffect(() => {
    if (productToUpdate) {
      setUpdatedQuantity(productToUpdate.assigned || 0);
      
      const fetchProductDetails = async () => {
        try {
          // Need to check product type and fetch from appropriate collection
          if (productToUpdate.type === 'res') {
            // For donation items, fetch from res collection
            const resDocRef = doc(db, "res", productToUpdate.productid);
            const resDoc = await getDoc(resDocRef);
            if (resDoc.exists()) {
              // Set remaining as the quantity for donation items
              const resData = resDoc.data();
              setCurrentProductDetails({
                ...resData,
                quantity: resData.remaining || 0, // Use remaining as quantity
                itemType: 'Donation',
                isResource: true
              });
            }
          } else {
            // For regular products, fetch from products collection
            const productDocRef = doc(db, "products", productToUpdate.productid);
            const productDoc = await getDoc(productDocRef);
            if (productDoc.exists()) {
              setCurrentProductDetails({
                ...productDoc.data(),
                itemType: 'Product',
                isResource: false
              });
            }
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      };
      
      fetchProductDetails();
    } else {
      setUpdatedQuantity(0);
      setCurrentProductDetails(null);
    }
  }, [productToUpdate]);

  // Reset assigned quantity when product selection changes
  useEffect(() => {
    if (selectedProduct) {
      setAssignedQuantity(1);
    } else {
      setAssignedQuantity(0);
    }
  }, [selectedProduct]);

  const handleIncreaseQuantity = () => {
    const maxAvailable = selectedProduct?.quantity || 0;
    if (assignedQuantity < maxAvailable) {
      setAssignedQuantity(prev => prev + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (assignedQuantity > 1) {
      setAssignedQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setAssignedQuantity(1);
    } else {
      const maxAvailable = selectedProduct?.quantity || 0;
      setAssignedQuantity(Math.min(value, maxAvailable));
    }
  };

  const handleUpdateQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
      setUpdatedQuantity(0);
    } else {
      // Calculate how many more items we can add from inventory
      const currentAvailable = currentProductDetails?.quantity || 0;
      const currentAssigned = productToUpdate?.assigned || 0;
      
      // If new quantity is greater than currently assigned, check if we have enough in inventory
      if (value > currentAssigned) {
        const additionalNeeded = value - currentAssigned;
        if (additionalNeeded > currentAvailable) {
          // Can only assign what's available plus what's already assigned
          setUpdatedQuantity(currentAssigned + currentAvailable);
        } else {
          setUpdatedQuantity(value);
        }
      } else {
        setUpdatedQuantity(value);
      }
    }
  };

  const handleIncreaseUpdateQuantity = () => {
    // Calculate how many more items we can add from inventory
    const currentAvailable = currentProductDetails?.quantity || 0;
    
    if (currentAvailable > 0) {
      setUpdatedQuantity(prev => prev + 1);
    }
  };

  const handleDecreaseUpdateQuantity = () => {
    if (updatedQuantity > 0) {
      setUpdatedQuantity(prev => prev - 1);
    }
  };

const handleAddProduct = async () => {
  if (!selectedProduct || assignedQuantity < 1) return;

  const maxAvailable = selectedProduct.quantity || 0;
  if (assignedQuantity > maxAvailable) {
    alert(`Cannot assign more than available quantity (${maxAvailable})`);
    return;
  }

  setIsAdding(true);
  try {
    const activityId = unwrappedParams['activity-Id'];
    const userDocRef = doc(db, "users", authUser.uid);
    const userDoc = await getDoc(userDocRef);
    const ngoId = userDoc.data()?.ngoId || authUser.uid;

    // Improved check for existing items with more robust matching
    const existingItemIndex = inventoryItems.findIndex(item => {
      // Match by productid (most reliable)
      if (item.productid === selectedProduct.id) {
        return true;
      }
      
      // For resources, also match by resource name if available
      if (selectedProduct.type === 'res' && item.type === 'res') {
        // Check resource field match if both have it
        if (item.resource && selectedProduct.resource && 
            item.resource.toLowerCase() === selectedProduct.resource.toLowerCase()) {
          return true;
        }
        
        // Check resourceName field match if both have it
        if (item.resourceName && selectedProduct.resourceName && 
            item.resourceName.toLowerCase() === selectedProduct.resourceName.toLowerCase()) {
          return true;
        }
      }
      
      // For products, match by product name if needed
      if (item.productname && selectedProduct.productName && 
          item.productname.toLowerCase() === selectedProduct.productName.toLowerCase()) {
        return true;
      }
      
      return false;
    });

    // Distribute quantity across sources
    let remainingToAssign = assignedQuantity;
    const sources = selectedProduct.sources || [];
    
    for (const source of sources) {
      if (remainingToAssign <= 0) break;

      const quantityFromSource = Math.min(source.quantity, remainingToAssign);
      remainingToAssign -= quantityFromSource;

      if (source.type === 'product') {
        // Update product collection
        const productDocRef = doc(db, "products", source.id);
        await updateDoc(productDocRef, {
          quantity: increment(-quantityFromSource),
          usedinevents: arrayUnion({
            eventid: activityId,
            eventName: eventDetails.eventName || "",
            eventDate: eventDetails.eventDate || "",
            assigned: quantityFromSource,
            remaining: quantityFromSource
          })
        });
      } else if (source.type === 'res') {
        // Update res collection - update BOTH quantity and remaining fields
        const resDocRef = doc(db, "res", source.id);
        await updateDoc(resDocRef, {
          quantity: increment(-quantityFromSource), // Decrement the main quantity field
          remaining: increment(-quantityFromSource), // Also decrement the remaining field
          usedinevents: arrayUnion({
            eventid: activityId,
            eventName: eventDetails.eventName || "",
            eventDate: eventDetails.eventDate || "",
            assigned: quantityFromSource,
            remaining: quantityFromSource
          })
        });
      }
    }

    if (existingItemIndex !== -1) {
      // Update existing item
      const existingItem = inventoryItems[existingItemIndex];
      const newAssignedQuantity = existingItem.assigned + assignedQuantity;
      const newRemainingQuantity = existingItem.remaining + assignedQuantity;

      // Update in activity's inventory subcollection
      const inventoryDocRef = doc(db, "activities", activityId, "inventory", existingItem.productid);
      await updateDoc(inventoryDocRef, {
        assigned: newAssignedQuantity,
        remaining: newRemainingQuantity,
        sources: [...(existingItem.sources || []), ...sources]
      });

      // Update in activity's main document
      const activityDocRef = doc(db, "activities", activityId);
      const activityDoc = await getDoc(activityDocRef);
      if (activityDoc.exists()) {
        const inventory = activityDoc.data().inventory || [];
        const updatedInventory = inventory.map(item => {
          if ((typeof item === 'string' && item === existingItem.productid) ||
              (item.productid === existingItem.productid)) {
            return {
              ...item,
              assignedQuantity: newAssignedQuantity,
              sources: [...(item.sources || []), ...sources]
            };
          }
          return item;
        });

        await updateDoc(activityDocRef, {
          inventory: updatedInventory
        });
      }

      // Update UI
      setInventoryItems(prev => 
        prev.map(item => {
          if (item.productid === existingItem.productid) {
            return {
              ...item,
              assigned: newAssignedQuantity,
              remaining: newRemainingQuantity,
              sources: [...(item.sources || []), ...sources]
            };
          }
          return item;
        })
      );
    } else {
      // Add new item
      // Prepare common data fields with proper fallbacks to prevent undefined values
      const productName = selectedProduct.productName || "Unnamed Item";
      
      // Prepare resource-specific fields with fallbacks
      const resourceName = selectedProduct.resourceName || selectedProduct.resource || productName;
      const resource = selectedProduct.resource || productName;
      
      // Create item data object with all required fields properly defaulted
      const itemData = {
        productname: productName,
        category: selectedProduct.category || "Uncategorized",
        assigned: assignedQuantity,
        used: 0,
        remaining: assignedQuantity,
        sources: selectedProduct.sources || [],
        type: selectedProduct.type || "product",
        addedAt: new Date().toISOString(),
        activityId: activityId,
        ngoId: ngoId
      };
      
      // Only add resource-specific fields if this is a resource/donation
      if (selectedProduct.type === 'res') {
        itemData.resource = resource;
        itemData.resourceName = resourceName;
      }
      
      // Add to activity's inventory
      const activityDocRef = doc(db, "activities", activityId);
      await updateDoc(activityDocRef, {
        inventory: arrayUnion({
          productid: selectedProduct.id,
          assignedQuantity: assignedQuantity,
          sources: selectedProduct.sources || [],
          type: selectedProduct.type || "product"
        })
      });

      // Add to activity's inventory subcollection
      const inventoryDocRef = doc(db, "activities", activityId, "inventory", selectedProduct.id);
      await setDoc(inventoryDocRef, itemData);

      // Update UI
      setInventoryItems(prev => [
        ...prev,
        {
          ...selectedProduct,
          ...itemData,
          productid: selectedProduct.id
        }
      ]);
    }

    // Reset and close
    setIsDialogOpen(false);
    setSelectedProduct(null);
    setAssignedQuantity(1);
    
  } catch (error) {
    console.error("Error adding product:", error);
    alert("Failed to add product. Please try again.");
  } finally {
    setIsAdding(false);
  }
};

const handleUpdateConfirmation = (item) => {
  setProductToUpdate(item);
  setIsUpdateDialogOpen(true);
};

// Update the handleUpdateProduct function to also update the usedinevents array
const handleUpdateProduct = async () => {
  if (!productToUpdate) return;
  
  setIsUpdating(true);
  try {
    const activityId = unwrappedParams['activity-Id'];
    const currentAssigned = productToUpdate.assigned || 0;
    const currentUsed = productToUpdate.used || 0;
    
    // Calculate the difference in quantity
    const quantityDifference = updatedQuantity - currentAssigned;
    
    // 1. Update the inventory item in the activity's subcollection
    const inventoryDocRef = doc(
      db,
      "activities",
      activityId,
      "inventory",
      productToUpdate.productid
    );
    
    // Calculate new remaining value based on usage
    const newRemaining = Math.max(0, updatedQuantity - currentUsed);
    
    await updateDoc(inventoryDocRef, {
      assigned: updatedQuantity,
      remaining: newRemaining
    });
    
    // 2. Update the activity's inventory array
    const activityDocRef = doc(db, "activities", activityId);
    const activityDoc = await getDoc(activityDocRef);
    
    if (activityDoc.exists()) {
      const activityData = activityDoc.data();
      let inventory = activityData.inventory || [];
      
      const updatedInventory = inventory.map(item => {
        if (typeof item === 'string' && item === productToUpdate.productid) {
          return {
            productid: productToUpdate.productid,
            assignedQuantity: updatedQuantity,
            type: productToUpdate.type
          };
        } else if (item.productid === productToUpdate.productid) {
          return {
            ...item,
            assignedQuantity: updatedQuantity,
            type: productToUpdate.type
          };
        }
        return item;
      });
      
      await updateDoc(activityDocRef, {
        inventory: updatedInventory
      });
    }
    
    // 3. Update the source collection (products or res) based on type
    if (quantityDifference !== 0) {
      if (productToUpdate.type === 'res') {
        // Update res collection
        const resDocRef = doc(db, "res", productToUpdate.productid);
        const resDoc = await getDoc(resDocRef);
        
        if (resDoc.exists()) {
          const resData = resDoc.data();
          // For donations, we directly update the remaining field AND quantity field
          // If quantityDifference is positive, we're assigning more items (reduce remaining)
          // If quantityDifference is negative, we're returning items (increase remaining)
          
          // First, check if this event is already in usedinevents array
          const usedInEvents = resData.usedinevents || [];
          const existingEventIndex = usedInEvents.findIndex(event => event.eventid === activityId);
          
          if (existingEventIndex !== -1) {
            // Update the existing entry
            const updatedUsedInEvents = [...usedInEvents];
            updatedUsedInEvents[existingEventIndex] = {
              ...updatedUsedInEvents[existingEventIndex],
              assigned: updatedQuantity,
              remaining: newRemaining,
              eventName: eventDetails.eventName || "",
              eventDate: eventDetails.eventDate || ""
            };
            
            await updateDoc(resDocRef, {
              quantity: increment(-quantityDifference), // Update main quantity field
              remaining: increment(-quantityDifference), // Update remaining field
              usedinevents: updatedUsedInEvents
            });
          } else {
            // Add new entry to usedinevents array
            await updateDoc(resDocRef, {
              quantity: increment(-quantityDifference), // Update main quantity field
              remaining: increment(-quantityDifference), // Update remaining field
              usedinevents: arrayUnion({
                eventid: activityId,
                eventName: eventDetails.eventName || "",
                eventDate: eventDetails.eventDate || "",
                assigned: updatedQuantity,
                remaining: newRemaining
              })
            });
          }
        }
      } else {
        // Update product collection
        const productDocRef = doc(db, "products", productToUpdate.productid);
        const productDoc = await getDoc(productDocRef);
        
        if (productDoc.exists()) {
          const productData = productDoc.data();
          
          // First, check if this event is already in usedinevents array
          const usedInEvents = productData.usedinevents || [];
          const existingEventIndex = usedInEvents.findIndex(event => event.eventid === activityId);
          
          if (existingEventIndex !== -1) {
            // Update the existing entry
            const updatedUsedInEvents = [...usedInEvents];
            updatedUsedInEvents[existingEventIndex] = {
              ...updatedUsedInEvents[existingEventIndex],
              assigned: updatedQuantity,
              remaining: newRemaining,
              eventName: eventDetails.eventName || "",
              eventDate: eventDetails.eventDate || ""
            };
            
            await updateDoc(productDocRef, {
              quantity: increment(-quantityDifference),
              usedinevents: updatedUsedInEvents
            });
          } else {
            // Add new entry to usedinevents array
            await updateDoc(productDocRef, {
              quantity: increment(-quantityDifference),
              usedinevents: arrayUnion({
                eventid: activityId,
                eventName: eventDetails.eventName || "",
                eventDate: eventDetails.eventDate || "",
                assigned: updatedQuantity,
                remaining: newRemaining
              })
            });
          }
        }
      }
    }
    
    // 4. Update the UI
    setInventoryItems(prev => 
      prev.map(item => {
        if (item.productid === productToUpdate.productid) {
          return {
            ...item,
            assigned: updatedQuantity,
            remaining: newRemaining
          };
        }
        return item;
      })
    );
    
    // Reset and close
    setIsUpdateDialogOpen(false);
    setProductToUpdate(null);
    setUpdatedQuantity(0);
  } catch (error) {
    console.error("Error updating product:", error);
    alert("Failed to update product. Please try again.");
  } finally {
    setIsUpdating(false);
  }
};

// Update the handleDeleteProduct function to remove the event from usedinevents array
const handleDeleteConfirmation = (item) => {
  setProductToDelete(item);
  setIsDeleteDialogOpen(true);
};


const handleDeleteProduct = async () => {
  if (!productToDelete) return;
  
  setIsDeleting(true);
  try {
    const activityId = unwrappedParams['activity-Id'];
    
    // 1. First find the inventory item in the activity to get the assigned quantity
    const inventoryDocRef = doc(db, "activities", activityId, "inventory", productToDelete.productid);
    const inventoryDoc = await getDoc(inventoryDocRef);
    
    let quantityToReturn = 0;
    if (inventoryDoc.exists()) {
      const inventoryData = inventoryDoc.data();
      quantityToReturn = inventoryData.remaining || 0;
    }
    
    // 2. Delete the product from the activity's inventory subcollection
    await deleteDoc(inventoryDocRef);
    
    // 3. Remove the product from the activity's inventory array
    const activityDocRef = doc(db, "activities", activityId);
    const itemToRemove = eventDetails.inventory.find(item => 
      (typeof item === 'string' && item === productToDelete.productid) || 
      (item.productid === productToDelete.productid)
    );
    
    if (itemToRemove) {
      await updateDoc(activityDocRef, {
        inventory: arrayRemove(itemToRemove)
      });
    }
    
    // 4. Update the source collection based on type
    if (productToDelete.type === 'res') {
      // Update res collection
      const resDocRef = doc(db, "res", productToDelete.productid);
      const resDoc = await getDoc(resDocRef);
      
      if (resDoc.exists()) {
        const resData = resDoc.data();
        const currentRemaining = resData.remaining || 0;
        
        // Update both quantity and remaining fields
        await updateDoc(resDocRef, {
          quantity: increment(quantityToReturn), // Increase main quantity
          remaining: increment(quantityToReturn) // Increase remaining quantity
        });
        
        // Remove the event from usedinevents array
        const usedInEvents = resData.usedinevents || [];
        const existingEventIndex = usedInEvents.findIndex(item => item.eventid === activityId);
        
        if (existingEventIndex !== -1) {
          const updatedUsedInEvents = [...usedInEvents];
          updatedUsedInEvents.splice(existingEventIndex, 1);
          
          await updateDoc(resDocRef, {
            usedinevents: updatedUsedInEvents
          });
        }
      }
    } else {
      // Update product collection
      const productDocRef = doc(db, "products", productToDelete.productid);
      const productDoc = await getDoc(productDocRef);
      
      if (productDoc.exists()) {
        const productData = productDoc.data();
        const currentQuantity = productData.quantity || 0;
        
        // Update quantity
        await updateDoc(productDocRef, {
          quantity: currentQuantity + quantityToReturn
        });
        
        // Remove the event from usedinevents array
        const usedInEvents = productData.usedinevents || [];
        const existingEventIndex = usedInEvents.findIndex(item => item.eventid === activityId);
        
        if (existingEventIndex !== -1) {
          const updatedUsedInEvents = [...usedInEvents];
          updatedUsedInEvents.splice(existingEventIndex, 1);
          
          await updateDoc(productDocRef, {
            usedinevents: updatedUsedInEvents
          });
        }
      }
    }
    
    // 5. Update the UI
    setInventoryItems(prev => 
      prev.filter(item => item.productid !== productToDelete.productid)
    );
    
    // 6. Update eventDetails
    if (eventDetails && eventDetails.inventory) {
      setEventDetails({
        ...eventDetails,
        inventory: eventDetails.inventory.filter(item => 
          (typeof item === 'string' && item !== productToDelete.productid) || 
          (item.productid !== productToDelete.productid)
        )
      });
    }
    
    // Reset and close
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  } catch (error) {
    console.error("Error deleting product:", error);
    alert("Failed to delete product. Please try again.");
  } finally {
    setIsDeleting(false);
  }
};

useEffect(() => {
  const fetchDonations = async () => {
    if (!authUser) {
      console.log("No authenticated user found");
      return;
    }

    try {
      // Get the NGO ID from the authenticated user
      const userDocRef = doc(db, "users", authUser.uid);
      const userDoc = await getDoc(userDocRef);
      const ngoId = userDoc.data()?.ngoId || authUser.uid;
      const currentYear = new Date().getFullYear().toString();

      // Get resources from the res collection
      const resCollection = collection(db, "res");
      const resQuery = query(resCollection, where("ngoId", "==", ngoId));
      const resSnapshot = await getDocs(resQuery);
      
      const allResources = resSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("All resources from res collection:", allResources);
      setDonations(allResources);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  fetchDonations();
}, [authUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!eventDetails) {
    return <div>Activity not found</div>;
  }

  // Inside the component, add this function to prepare report data
  const prepareReportData = () => {
    return {
      ngoInfo: {
        name: "NGO Connect Organization",
        address: "Your organization address",
        email: "contact@ngoconnect.org",
      },
      eventName: eventDetails?.eventName || "Event",
      eventDate: eventDetails?.eventDate || new Date().toISOString().split('T')[0],
      location: eventDetails?.location || "N/A",
      timeFrame: "Event Period",
      date: new Date().toISOString().split('T')[0],
      inventoryItems: inventoryItems,
      productStats: {
        total: inventoryItems.filter(item => item.type !== 'res').length,
        assigned: inventoryItems.filter(item => item.type !== 'res').reduce((sum, item) => sum + (item.assigned || 0), 0),
        used: inventoryItems.filter(item => item.type !== 'res').reduce((sum, item) => sum + (item.used || 0), 0),
        remaining: inventoryItems.filter(item => item.type !== 'res').reduce((sum, item) => sum + (item.remaining || 0), 0)
      },
      donationStats: {
        total: inventoryItems.filter(item => item.type === 'res').length,
        assigned: inventoryItems.filter(item => item.type === 'res').reduce((sum, item) => sum + (item.assigned || 0), 0),
        used: inventoryItems.filter(item => item.type === 'res').reduce((sum, item) => sum + (item.used || 0), 0),
        remaining: inventoryItems.filter(item => item.type === 'res').reduce((sum, item) => sum + (item.remaining || 0), 0)
      }
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Event Inventory Analytics</h1>

      <Card>
        <CardHeader>
          <CardTitle>{eventDetails?.eventName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{eventDetails?.eventDate}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{eventDetails?.location}</span>
            </div>
            <div className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              <span>Total Products: {eventDetails?.inventory?.length || 0}</span>
            </div>
          </div>
          <div className="flex items-center mt-2">
            <FileText className="mr-2 h-4 w-4" />
            <span>Contact: {eventDetails?.contactEmail}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-baseline mt-5">
          <CardTitle className="text-left text-2xl">Inventory Assigned to This Event</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1CAC78] hover:bg-[#158f63] ml-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Product to Event</DialogTitle>
              </DialogHeader>
              
              <div className="mt-4">
                <Command className="rounded-lg border shadow-sm">
                  <CommandInput 
                    placeholder="Search products and donations..." 
                    className="h-9"
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList className="max-h-60 overflow-auto">
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup heading="Products">
                      {availableProducts
                        .filter(product => {
                          if (!product || !product.productName) return false;
                          const searchIn = product.productName.toLowerCase();
                          return searchIn.includes((searchQuery || '').toLowerCase());
                        })
                        .map(product => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => {
                              setSelectedProduct({
                                ...product,
                                id: product.id,
                                type: 'product',
                                productName: product.productName || 'Unnamed Product',
                                category: product.category || 'Uncategorized',
                                quantity: product.quantity || 0
                              });
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between py-2"
                          >
                            <div>
                              <div className="font-medium">{product.productName || 'Unnamed Product'}</div>
                              <div className="text-sm text-gray-500">{product.category || 'Uncategorized'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="ml-2">
                                Qty: {product.quantity || 0}
                              </Badge>
                              <Badge variant="secondary">Product</Badge>
                            </div>
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                    <CommandGroup heading="Donations">
                      {resItems
                        .filter(item => {
                          if (!item || !item.productName) return false;
                          const searchIn = item.productName.toLowerCase();
                          return searchIn.includes((searchQuery || '').toLowerCase());
                        })
                        .map(item => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => {
                              setSelectedProduct({
                                ...item,
                                id: item.id,
                                type: 'res',
                                productName: item.productName || 'Unnamed Donation',
                                resource: item.resource || item.productName,
                                resourceName: item.resourceName || item.productName,
                                category: item.category || 'Uncategorized',
                                quantity: item.remaining || 0,
                                remaining: item.remaining || 0,
                                resourceId: item.id,
                                isResource: true,
                                itemType: 'Donation'
                              });
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between py-2"
                          >
                            <div>
                              <div className="font-medium">{item.resourceName || item.productName || 'Unnamed Donation'}</div>
                              <div className="text-sm text-gray-500">
                                Resource: {item.resource || item.productName || 'N/A'} • {item.category || 'Uncategorized'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="ml-2">
                                Qty: {item.remaining || 0}
                              </Badge>
                              <Badge variant="destructive">Donation</Badge>
                            </div>
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>

              {selectedProduct && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                    <div>
                      <div className="font-medium">{selectedProduct.productName}</div>
                      <div className="text-sm text-gray-500">
                        {selectedProduct.category} • Available: {selectedProduct.quantity}
                        {selectedProduct.type === 'res' && ' (Donation)'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedProduct(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Assign Quantity:</Label>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleDecreaseQuantity}
                        disabled={assignedQuantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        value={assignedQuantity}
                        onChange={handleQuantityChange}
                        min={1}
                        max={selectedProduct.quantity || 0}
                        className="h-8 mx-2 w-20 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleIncreaseQuantity}
                        disabled={assignedQuantity >= (selectedProduct.quantity || 0)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="ml-2 text-sm text-gray-500">
                        of {selectedProduct.quantity || 0} available
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || assignedQuantity < 1 || isAdding || assignedQuantity > (selectedProduct?.quantity || 0)}
                  className="bg-[#1CAC78] hover:bg-[#158f63]"
                >
                  {isAdding ? "Adding..." : "Add to Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item, index) => (
                <TableRow key={`${item.productid}-${index}`}>
                  <TableCell className="font-medium">
                    {item.type === 'res' ? (
                      <div>
                        <div>{item.resourceName || 'Unnamed Item'}</div>
                        <div className="text-xs text-gray-500">{item.resource || 'General'}</div>
                      </div>
                    ) : (
                      item.productname
                    )}
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.assigned}</TableCell>
                  <TableCell>{item.used}</TableCell>
                  <TableCell>{item.remaining}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button asChild>
                        <Link href={`/dashboard/ngo/inventory/product/${item.productid}`}>
                          View Analytics
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleUpdateConfirmation(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => handleDeleteConfirmation(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Usage Trends & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Products Usage</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inventoryItems.filter(item => item.type !== 'res')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productname" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="assigned" stroke="#8884d8" name="Total Assigned" />
                    <Line type="monotone" dataKey="used" stroke="#82ca9d" name="Used" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Donations Usage</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inventoryItems.filter(item => item.type === 'res')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="resourceName" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="assigned" stroke="#ff7979" name="Total Assigned" />
                    <Line type="monotone" dataKey="used" stroke="#e17055" name="Used" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Frequently Used Products:</h3>
              <ul className="list-disc list-inside">
                {inventoryItems
                  .filter(item => item.type !== 'res' && (item.used || 0) > (item.assigned || 0) * 0.5)
                  .map(item => (
                    <li key={item.productid}>{item.productname}</li>
                  ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Frequently Used Donations:</h3>
              <ul className="list-disc list-inside">
                {inventoryItems
                  .filter(item => item.type === 'res' && (item.used || 0) > (item.assigned || 0) * 0.5)
                  .map(item => (
                    <li key={item.productid}>{item.resourceName} ({item.resource})</li>
                  ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold">Inventory Summary:</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-lg font-medium">Products</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>Total Items: <span className="font-medium">
                    {inventoryItems.filter(item => item.type !== 'res').length}
                  </span></div>
                  <div>Total Assigned: <span className="font-medium">
                    {inventoryItems.filter(item => item.type !== 'res').reduce((sum, item) => sum + (item.assigned || 0), 0)}
                  </span></div>
                  <div>Total Used: <span className="font-medium">
                    {inventoryItems.filter(item => item.type !== 'res').reduce((sum, item) => sum + (item.used || 0), 0)}
                  </span></div>
                  <div>Total Remaining: <span className="font-medium">
                    {inventoryItems.filter(item => item.type !== 'res').reduce((sum, item) => sum + (item.remaining || 0), 0)}
                  </span></div>
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-md">
                <div className="text-lg font-medium">Donations</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>Total Items: <span className="font-medium">
                    {inventoryItems.filter(item => item.type === 'res').length}
                  </span></div>
                  <div>Total Assigned: <span className="font-medium">
                    {inventoryItems.filter(item => item.type === 'res').reduce((sum, item) => sum + (item.assigned || 0), 0)}
                  </span></div>
                  <div>Total Used: <span className="font-medium">
                    {inventoryItems.filter(item => item.type === 'res').reduce((sum, item) => sum + (item.used || 0), 0)}
                  </span></div>
                  <div>Total Remaining: <span className="font-medium">
                    {inventoryItems.filter(item => item.type === 'res').reduce((sum, item) => sum + (item.remaining || 0), 0)}
                  </span></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {!loading && inventoryItems.length > 0 && (
          <PDFDownloadButton
            reportData={prepareReportData()}
            fileName={`${eventDetails.eventName || 'Event'}_Inventory_Report.pdf`}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {productToDelete?.type === 'res' ? 'Donation' : 'Product'} from Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove 
              {productToDelete?.type === 'res' ? (
                <strong> {productToDelete?.resourceName || 'this donation'} ({productToDelete?.resource || 'General'}) </strong>
              ) : (
                <strong> {productToDelete?.productname} </strong>
              )}
              from this event? Any remaining quantity will be returned to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Quantity Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Assigned Quantity</DialogTitle>
            <DialogDescription>
              Adjust the quantity of <strong>{productToUpdate?.productname}</strong> assigned to this event.
            </DialogDescription>
          </DialogHeader>
          
          {productToUpdate && (
            <div className="mt-4 space-y-4">
              <div className={productToUpdate.type === 'res' ? "bg-red-50 p-3 rounded-md" : "bg-blue-50 p-3 rounded-md"}>
                <div className="font-medium">
                  {productToUpdate.type === 'res' ? (
                    <>
                      {productToUpdate.resourceName || 'Unnamed Item'}
                      <div className="text-sm font-normal text-gray-700">{productToUpdate.resource || 'General'}</div>
                    </>
                  ) : (
                    productToUpdate.productname
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Category: {productToUpdate.category} • 
                  <Badge variant={productToUpdate.type === 'res' ? "destructive" : "secondary"} className="ml-2">
                    {productToUpdate.type === 'res' ? "Donation" : "Product"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>Currently Assigned: <span className="font-medium">{productToUpdate.assigned}</span></div>
                  <div>Used: <span className="font-medium">{productToUpdate.used || 0}</span></div>
                  <div>Remaining in Event: <span className="font-medium">{productToUpdate.remaining || 0}</span></div>
                  <div>Available in {productToUpdate.type === 'res' ? "Donations" : "Inventory"}: <span className="font-medium">{currentProductDetails?.quantity || 0}</span></div>
                  {productToUpdate.type === 'res' && (
                    <div className="col-span-2">Donation Source ID: <span className="font-medium">{productToUpdate.productid}</span></div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="updatedQuantity">New Assigned Quantity:</Label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDecreaseUpdateQuantity}
                    disabled={updatedQuantity <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="updatedQuantity"
                    type="number"
                    value={updatedQuantity}
                    onChange={handleUpdateQuantityChange}   
                    min={0}
                    className="h-8 mx-2 w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleIncreaseUpdateQuantity}
                    disabled={
                      (currentProductDetails?.quantity || 0) <= 0 || 
                      updatedQuantity >= (productToUpdate.assigned + (currentProductDetails?.quantity || 0))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="ml-2 text-sm text-gray-500">
                    Max: {productToUpdate.assigned + (currentProductDetails?.quantity || 0)}
                  </span>
                </div>
                {productToUpdate.used > 0 && productToUpdate.used > updatedQuantity && (
                  <div className="mt-2 text-sm text-red-500 flex items-center">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    Warning: New quantity is less than currently used amount.
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsUpdateDialogOpen(false);
                setProductToUpdate(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProduct}
              disabled={
                !productToUpdate || 
                updatedQuantity === productToUpdate?.assigned || 
                isUpdating
              }
              className="bg-[#1CAC78] hover:bg-[#158f63]"
            >
              {isUpdating ? "Updating..." : "Update Quantity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}