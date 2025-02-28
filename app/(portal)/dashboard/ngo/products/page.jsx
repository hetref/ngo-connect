"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Filter, Calendar, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase"; // You'll need to create this firebase config file
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customCategory, setCustomCategory] = useState("");
  
  // Form state
  const [productData, setProductData] = useState({
    productName: "",
    category: "",
    quantity: "",
    description: "",
    productImage: "", // You might want to use Firebase Storage for actual image upload
  });

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(productsQuery);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value, field) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Reset custom category when another category is selected
    if (field === "category" && value !== "Other") {
      setCustomCategory("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If "Other" is selected, use the custom category value
      const finalCategory = productData.category === "Other" && customCategory ? 
        customCategory : productData.category;
      
      // Prepare data for Firestore
      const productToAdd = {
        ...productData,
        category: finalCategory,
        quantity: parseInt(productData.quantity) || 0,
        createdAt: serverTimestamp(),
      };

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "products"), productToAdd);
      
      // Add the new product to the state with its ID
      const newProduct = {
        id: docRef.id,
        ...productToAdd,
      };
      
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      
      // Reset form and close modal
      setProductData({
        productName: "",
        category: "",
        quantity: "",
        description: "",
        productImage: "",
      });
      setCustomCategory("");
      setIsModalOpen(false);
      
    } catch (error) {
      console.error("Error adding product: ", error);
      // Handle error (show error message to user)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this helper function at the top level of your component
  const isValidUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Add this computed value before the return statement
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-5xl font-bold mb-8">NGO Products Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Products Listing</CardTitle>
          <Button 
            className="bg-[#1CAC78] hover:bg-[#158f63] ml-auto"
            onClick={() => setIsModalOpen(true)}
          >
            Add Product
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>

          {/* Products Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading products...</TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.productImage && isValidUrl(product.productImage) ? (
                        <div className="relative w-24 h-24">
                          <Image
                            src={product.productImage}
                            alt={product.productName}
                            width={96}
                            height={96}
                            className="object-cover rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-500 rounded-md">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <Button asChild>
                        <Link href={`/dashboard/ngo/inventory/product/${product.id}`}>
                          View Product
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No products found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={productData.productName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="productImage">Product Image URL</Label>
                <Input
                  id="productImage"
                  name="productImage"
                  value={productData.productImage}
                  onChange={handleInputChange}
                  placeholder="Image URL or placeholder"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={productData.category} 
                  onValueChange={(value) => handleSelectChange(value, "category")}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Category Input - Only shows when "Other" is selected */}
              {productData.category === "Other" && (
                <div className="grid gap-2">
                  <Label htmlFor="customCategory">Specify Category</Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    required
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={productData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={productData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1CAC78] hover:bg-[#158f63]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}