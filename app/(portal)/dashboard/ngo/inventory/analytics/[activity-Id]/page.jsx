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
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc, deleteDoc, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
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

export default function NGOInventoryAnalyticsPage({ params }) {
  const unwrappedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [eventDetails, setEventDetails] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [availableProducts, setAvailableProducts] = useState([])
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

        const inventoryPromises = activityData.inventory.map(async (item) => {
          const productId = typeof item === 'string' ? item : item.productid;
          
          if (!productId) {
            console.log("No product ID for item:", item);
            return null;
          }

          try {
            const inventoryDocRef = doc(db, "activities", unwrappedParams['activity-Id'], "inventory", productId);
            const inventoryDoc = await getDoc(inventoryDocRef);

            if (inventoryDoc.exists()) {
              return { ...item, ...inventoryDoc.data(), id: productId };
            } else {
              console.log(`No details found for product ${productId}`);
              return item;
            }
          } catch (error) {
            console.error(`Error fetching inventory item ${productId}:`, error);
            return item;
          }
        });

        const detailedInventory = (await Promise.all(inventoryPromises)).filter(item => item !== null);
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
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products")
        const snapshot = await getDocs(productsCollection)
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setAvailableProducts(products)
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    if (isDialogOpen) fetchProducts()
  }, [isDialogOpen]);

  useEffect(() => {
    if (productToUpdate) {
      setUpdatedQuantity(productToUpdate.assigned || 0);
      
      const fetchProductDetails = async () => {
        try {
          const productDocRef = doc(db, "products", productToUpdate.productid);
          const productDoc = await getDoc(productDocRef);
          if (productDoc.exists()) {
            setCurrentProductDetails(productDoc.data());
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

// Update the handleAddProduct function to store additional event information
const handleAddProduct = async () => {
  if (!selectedProduct || assignedQuantity < 1) return;

  const maxAvailable = selectedProduct?.quantity || 0;
  if (assignedQuantity > maxAvailable) {
    alert(`Cannot assign more than available quantity (${maxAvailable})`);
    return;
  }

  setIsAdding(true);
  try {
    const activityId = unwrappedParams['activity-Id'];
    
    // 1. Update the activity document to include this product in inventory
    const activityDocRef = doc(db, "activities", activityId);
    
    await updateDoc(activityDocRef, {
      inventory: arrayUnion({ 
        productid: selectedProduct.id,
        assignedQuantity: assignedQuantity 
      })
    });

    // 2. Add product details to the activity's inventory subcollection
    const inventoryDocRef = doc(
      db,
      "activities",
      activityId,
      "inventory",
      selectedProduct.id
    );

    // Use productName if it exists, otherwise fall back to name
    const productName = selectedProduct.productName || selectedProduct.name;
    const category = selectedProduct.category || "Uncategorized";

    await setDoc(inventoryDocRef, {
      productname: productName,
      category: category,
      assigned: assignedQuantity,
      used: 0,
      remaining: assignedQuantity,
      expiry: ""
    });

    // 3. Update the product collection to reduce available quantity
    // and add this event to usedinevents array with additional information
    const newProductQuantity = (selectedProduct.quantity || 0) - assignedQuantity;
    const productDocRef = doc(db, "products", selectedProduct.id);
    
    // Get current product data first to check if usedinevents already exists
    const productDoc = await getDoc(productDocRef);
    if (productDoc.exists()) {
      const productData = productDoc.data();
      // Check if event is already in usedinevents array
      const usedInEvents = productData.usedinevents || [];
      
      // Create an enhanced event object with more details
      const eventObject = { 
        eventid: activityId,
        eventName: eventDetails.eventName || "",
        eventDate: eventDetails.eventDate || "",
        assigned: assignedQuantity,
        remaining: assignedQuantity
      };
      
      const existingEventIndex = usedInEvents.findIndex(item => item.eventid === activityId);
      
      if (existingEventIndex === -1) {
        // Only add the event if it's not already in the array
        await updateDoc(productDocRef, {
          quantity: newProductQuantity,
          usedinevents: arrayUnion(eventObject)
        });
      } else {
        // If event already exists, we need to update it with the new values
        // First remove the old entry, then add the updated one
        const updatedUsedInEvents = [...usedInEvents];
        
        // Remove the old entry
        updatedUsedInEvents.splice(existingEventIndex, 1);
        
        // Add the new entry
        updatedUsedInEvents.push(eventObject);
        
        await updateDoc(productDocRef, {
          quantity: newProductQuantity,
          usedinevents: updatedUsedInEvents
        });
      }
    } else {
      // If product doesn't exist yet (unusual case)
      await setDoc(productDocRef, {
        quantity: newProductQuantity,
        usedinevents: [{ 
          eventid: activityId,
          eventName: eventDetails.eventName || "",
          eventDate: eventDetails.eventDate || "",
          assigned: assignedQuantity,
          remaining: assignedQuantity
        }]
      });
    }

    // 4. Update the UI
    setInventoryItems(prev => [
      ...prev,
      {
        ...selectedProduct,
        id: selectedProduct.id,
        productid: selectedProduct.id,
        productname: productName,
        category: category,
        assigned: assignedQuantity,
        used: 0,
        remaining: assignedQuantity
      }
    ]);
    
    // Update the product in availableProducts array
    setAvailableProducts(prev => 
      prev.map(product => 
        product.id === selectedProduct.id 
          ? { 
              ...product, 
              quantity: newProductQuantity,
              usedinevents: [...(product.usedinevents || []).filter(item => item.eventid !== activityId), { 
                eventid: activityId,
                eventName: eventDetails.eventName || "",
                eventDate: eventDetails.eventDate || "",
                assigned: assignedQuantity,
                remaining: assignedQuantity
              }]
            }
          : product
      )
    );
    
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
    // First find the current item in the array
    const activityDocRef = doc(db, "activities", activityId);
    
    // Need to know the current activity data to update the specific inventory item
    const activityDoc = await getDoc(activityDocRef);
    if (activityDoc.exists()) {
      const activityData = activityDoc.data();
      let inventory = activityData.inventory || [];
      
      // Find and update the specific inventory item
      const updatedInventory = inventory.map(item => {
        if (typeof item === 'string' && item === productToUpdate.productid) {
          // Convert string to object with updated quantity
          return {
            productid: productToUpdate.productid,
            assignedQuantity: updatedQuantity
          };
        } else if (item.productid === productToUpdate.productid) {
          // Update existing object
          return {
            ...item,
            assignedQuantity: updatedQuantity
          };
        }
        return item;
      });
      
      // Update the activity document
      await updateDoc(activityDocRef, {
        inventory: updatedInventory
      });
    }
    
    // 3. Update the product quantity in the main product collection
    // and update the usedinevents array with new values
    if (quantityDifference !== 0 || newRemaining !== productToUpdate.remaining) {
      const productDocRef = doc(db, "products", productToUpdate.productid);
      const productDoc = await getDoc(productDocRef);
      
      if (productDoc.exists()) {
        const productData = productDoc.data();
        const currentQuantity = productData.quantity || 0;
        // If quantityDifference is positive, we're assigning more items (reduce product quantity)
        // If quantityDifference is negative, we're returning items (increase product quantity)
        const newProductQuantity = currentQuantity - quantityDifference;
        
        // Update the event information in usedinevents array
        const usedInEvents = productData.usedinevents || [];
        const existingEventIndex = usedInEvents.findIndex(item => item.eventid === activityId);
        
        if (existingEventIndex !== -1) {
          // If event exists, update it with new values
          const updatedUsedInEvents = [...usedInEvents];
          updatedUsedInEvents[existingEventIndex] = {
            ...updatedUsedInEvents[existingEventIndex],
            assigned: updatedQuantity,
            remaining: newRemaining
          };
          
          await updateDoc(productDocRef, {
            quantity: newProductQuantity,
            usedinevents: updatedUsedInEvents
          });
        } else {
          // If event doesn't exist (unusual case), add it
          await updateDoc(productDocRef, {
            quantity: newProductQuantity,
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
      // We'll return the remaining quantity back to product inventory
      quantityToReturn = inventoryData.remaining || 0;
    }
    
    // 2. Delete the product from the activity's inventory subcollection
    await deleteDoc(inventoryDocRef);
    
    // 3. Remove the product from the activity's inventory array
    const activityDocRef = doc(db, "activities", activityId);
    
    // Find the exact inventory item object to remove
    const itemToRemove = eventDetails.inventory.find(item => 
      (typeof item === 'string' && item === productToDelete.productid) || 
      (item.productid === productToDelete.productid)
    );
    
    if (itemToRemove) {
      await updateDoc(activityDocRef, {
        inventory: arrayRemove(itemToRemove)
      });
    }
    
    // 4. Update the product collection to increase available quantity
    // and remove this event from usedinevents array
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
        // If event exists, remove it
        const updatedUsedInEvents = [...usedInEvents];
        updatedUsedInEvents.splice(existingEventIndex, 1);
        
        await updateDoc(productDocRef, {
          usedinevents: updatedUsedInEvents
        });
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
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!eventDetails) {
    return <div>Activity not found</div>;
  }

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
        <CardContent className="flex items-baseline">
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
                    placeholder="Search products..." 
                    className="h-9"
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList className="max-h-60 overflow-auto">
                    <CommandEmpty>No products found.</CommandEmpty>
                    <CommandGroup>
                      {availableProducts
                        .filter(product => {
                          const searchIn = (product.productName || product.name || "").toLowerCase();
                          return searchIn.includes(searchQuery.toLowerCase());
                        })
                        .map(product => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => {
                              setSelectedProduct(product);
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between py-2"
                          >
                            <div>
                              <div className="font-medium">{product.productName || product.name}</div>
                              <div className="text-sm text-gray-500">{product.category}</div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              Qty: {product.quantity || 0}
                            </Badge>
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
                      <div className="font-medium">{selectedProduct.productName || selectedProduct.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedProduct.category} • Available: {selectedProduct.quantity || 0}
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.productid}>
                  <TableCell className="font-medium">{item.productname}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.assigned}</TableCell>
                  <TableCell>{item.used}</TableCell>
                  <TableCell>{item.remaining}</TableCell>
                  <TableCell>{item.expiry || 'N/A'}</TableCell>
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productname" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="assigned" stroke="#8884d8" name="Total Assigned" />
                <Line type="monotone" dataKey="used" stroke="#82ca9d" name="Used" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Frequently Used Items:</h3>
            <ul className="list-disc list-inside">
              {inventoryItems
                .filter(item => (item.used || 0) > (item.assigned || 0) * 0.5)
                .map(item => (
                  <li key={item.productid}>{item.productname}</li>
                ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
          <FileText className="mr-2 h-4 w-4" />
          Generate PDF Report
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product from Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{productToDelete?.productname}</strong> from this event? 
              Any remaining quantity will be returned to inventory.
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
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="font-medium">{productToUpdate.productname}</div>
                <div className="text-sm text-gray-500">
                  Category: {productToUpdate.category}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>Currently Assigned: <span className="font-medium">{productToUpdate.assigned}</span></div>
                  <div>Used: <span className="font-medium">{productToUpdate.used || 0}</span></div>
                  <div>Remaining: <span className="font-medium">{productToUpdate.remaining || 0}</span></div>
                  <div>In Inventory: <span className="font-medium">{currentProductDetails?.quantity || 0}</span></div>
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
                      updatedQuantity >= (productToUpdate.assigned + currentProductDetails?.quantity || 0)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
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