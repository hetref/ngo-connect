'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { jsPDF } from "jspdf";

export default function PDFDownloadButton({ reportData, fileName }) {
    const [isClient, setIsClient] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const generatePdf = () => {
        try {
            setIsPreparing(true);
            setHasError(false);
            
            // Create a new PDF document
            const doc = new jsPDF();
            
            // Set up initial document properties
            doc.setFontSize(20);
            doc.text("Inventory Report", 20, 20);
            
            // Add event and NGO info
            doc.setFontSize(12);
            doc.text(`Event: ${reportData.eventName || 'N/A'}`, 20, 30);
            doc.text(`NGO: ${reportData.ngoInfo?.name || 'N/A'}`, 20, 40);
            doc.text(`Date: ${reportData.date || new Date().toLocaleDateString()}`, 20, 50);
            
            // Add summary statistics
            doc.setFontSize(14);
            doc.text("Inventory Summary", 20, 70);
            
            // Products stats
            doc.setFontSize(12);
            doc.text("Products Statistics:", 20, 80);
            doc.text(`Total Products: ${reportData.productStats?.total || 0}`, 30, 90);
            doc.text(`Assigned: ${reportData.productStats?.assigned || 0}`, 30, 100);
            doc.text(`Used: ${reportData.productStats?.used || 0}`, 30, 110);
            doc.text(`Remaining: ${reportData.productStats?.remaining || 0}`, 30, 120);
            
            // Donations stats
            doc.text("Donations Statistics:", 120, 80);
            doc.text(`Total Donations: ${reportData.donationStats?.total || 0}`, 130, 90);
            doc.text(`Assigned: ${reportData.donationStats?.assigned || 0}`, 130, 100);
            doc.text(`Used: ${reportData.donationStats?.used || 0}`, 130, 110);
            doc.text(`Remaining: ${reportData.donationStats?.remaining || 0}`, 130, 120);
            
            // Create a simple table header for inventory items
            doc.setFontSize(14);
            doc.text("Inventory Items", 20, 140);
            
            // Column headers
            doc.setFontSize(10);
            doc.text("Item Name", 20, 150);
            doc.text("Category", 80, 150);
            doc.text("Assigned", 120, 150);
            doc.text("Used", 150, 150);
            doc.text("Remaining", 180, 150);
            
            // Draw a line under headers
            doc.setLineWidth(0.5);
            doc.line(20, 155, 190, 155);
            
            // Add inventory items
            let yPosition = 165;
            
            // Function to add a new page if needed
            const checkForNewPage = (y) => {
                if (y > 280) {
                    doc.addPage();
                    // Reset y position and redraw headers
                    yPosition = 20;
                    doc.setFontSize(10);
                    doc.text("Item Name", 20, yPosition);
                    doc.text("Category", 80, yPosition);
                    doc.text("Assigned", 120, yPosition);
                    doc.text("Used", 150, yPosition);
                    doc.text("Remaining", 180, yPosition);
                    
                    // Draw a line under headers
                    doc.setLineWidth(0.5);
                    doc.line(20, yPosition + 5, 190, yPosition + 5);
                    
                    return yPosition + 15;
                }
                return y;
            };
            
            // Add inventory items (limit to a reasonable number to avoid huge PDFs)
            const items = reportData.inventoryItems || [];
            const maxItems = Math.min(items.length, 100); // Limit to 100 items to avoid huge PDFs
            
            for (let i = 0; i < maxItems; i++) {
                const item = items[i];
                if (!item) continue;
                
                // Check if we need a new page
                yPosition = checkForNewPage(yPosition);
                
                // Item name (products or resources)
                const itemName = item.productname || 
                    (item.resourceName ? `${item.resourceName} (${item.resource || 'General'})` : 'N/A');
                
                doc.text(itemName.substring(0, 35), 20, yPosition); // Limit length to avoid overflow
                doc.text(item.category || 'N/A', 80, yPosition);
                doc.text(String(item.assigned || 0), 120, yPosition);
                doc.text(String(item.used || 0), 150, yPosition);
                doc.text(String(item.remaining || 0), 180, yPosition);
                
                yPosition += 10;
            }
            
            // Add footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(`Page ${i} of ${pageCount}`, 100, 290);
            }
            
            // Save the PDF
            doc.save(`${fileName || 'inventory-report'}.pdf`);
            setIsPreparing(false);
        } catch (error) {
            console.error("Error generating PDF:", error);
            setHasError(true);
            setIsPreparing(false);
        }
    };

    // Show loading state when not on client
    if (!isClient) {
        return (
            <Button className="bg-[#1CAC78] hover:bg-[#158f63]" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Loading PDF Generator...
            </Button>
        );
    }

    // Show error state
    if (hasError) {
        return (
            <Button className="bg-red-500 hover:bg-red-600" onClick={generatePdf}>
                <FileText className="mr-2 h-4 w-4" />
                Retry PDF Generation
            </Button>
        );
    }

    // Show preparing state
    if (isPreparing) {
        return (
            <Button className="bg-[#1CAC78] hover:bg-[#158f63]" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Preparing PDF...
            </Button>
        );
    }

    return (
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]" onClick={generatePdf}>
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF Report
        </Button>
    );
} 