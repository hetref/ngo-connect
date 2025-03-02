import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

// Create styles (using the same styles as donation report)
const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#fff",
        padding: 30,
    },
    header: {
        marginBottom: 20,
        borderBottom: "1pt solid #eaeaea",
        paddingBottom: 10,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    logoContainer: {
        width: 70,
        height: 70,
        backgroundColor: "#f0f0f0",
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
    },
    logoPlaceholder: {
        fontSize: 12,
        color: "#666",
    },
    organization: {
        maxWidth: "70%",
    },
    ngoName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    ngoDetails: {
        fontSize: 10,
        color: "#666",
        marginBottom: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 10,
        marginBottom: 5,
        color: "#333",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        color: "#666",
    },
    section: {
        margin: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#444",
        borderBottom: "1pt solid #eaeaea",
        paddingBottom: 5,
    },
    summary: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
        flexWrap: "wrap",
    },
    summaryItem: {
        width: "30%",
        marginBottom: 10,
        backgroundColor: "#f9f9f9",
        padding: 10,
        borderRadius: 5,
    },
    summaryLabel: {
        fontSize: 10,
        color: "#666",
        marginBottom: 3,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    table: {
        display: "table",
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#eaeaea",
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 10,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomColor: "#eaeaea",
    },
    tableHeader: {
        backgroundColor: "#f5f5f5",
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#eaeaea",
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
        textAlign: "center",
    },
    tableHeaderCell: {
        margin: 5,
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "center",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 10,
        textAlign: "center",
        color: "#666",
        borderTopColor: "#eaeaea",
        borderTopWidth: 1,
        paddingTop: 10,
    },
    reportMeta: {
        fontSize: 10,
        marginBottom: 10,
        color: "#666",
    },
    note: {
        fontSize: 10,
        fontStyle: "italic",
        color: "#666",
        marginTop: 20,
    },
    breakdownBox: {
        marginTop: 10,
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        padding: 5,
    },
    tableColWide: {
        width: "30%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#eaeaea",
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColNarrow: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#eaeaea",
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
});

// Simplify the component to avoid function errors
function InventoryReportPDF({ reportData }) {
    // Safely handle potentially undefined data with defaults
    const data = reportData || {
        ngoInfo: { name: 'NGO Connect', address: 'Default Address', email: 'contact@example.com' },
        eventName: 'Event',
        eventDate: new Date().toLocaleDateString(),
        location: 'Unknown Location',
        date: new Date().toLocaleDateString(),
        productStats: { total: 0, assigned: 0, used: 0, remaining: 0 },
        donationStats: { total: 0, assigned: 0, used: 0, remaining: 0 },
        inventoryItems: []
    };
    
    // Get current year for copyright notice
    const currentYear = new Date().getFullYear();
    
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with organization info */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.organization}>
                            <Text style={styles.ngoName}>{data.ngoInfo.name}</Text>
                            <Text style={styles.ngoDetails}>{data.ngoInfo.address}</Text>
                            <Text style={styles.ngoDetails}>{data.ngoInfo.email}</Text>
                        </View>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoPlaceholder}>LOGO</Text>
                        </View>
                    </View>
                </View>

                {/* Report Title */}
                <Text style={styles.title}>Event Inventory Report</Text>
                <Text style={styles.subtitle}>{data.eventName}</Text>
                <Text style={styles.reportMeta}>
                    Event Date: {data.eventDate} | Location: {data.location} | Generated on: {data.date}
                </Text>

                {/* Inventory Overview Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Inventory Overview</Text>

                    {/* Summary boxes */}
                    <View style={styles.summary}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Products</Text>
                            <Text style={styles.summaryValue}>
                                {data.productStats.total}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Donations</Text>
                            <Text style={styles.summaryValue}>
                                {data.donationStats.total}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Items</Text>
                            <Text style={styles.summaryValue}>
                                {data.productStats.total + data.donationStats.total}
                            </Text>
                        </View>
                    </View>

                    {/* Products Stats */}
                    <Text style={styles.sectionTitle}>Products Statistics</Text>
                    <View style={styles.breakdownBox}>
                        <View style={styles.breakdownItem}>
                            <Text>Assigned Quantity:</Text>
                            <Text>{data.productStats.assigned}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text>Used Quantity:</Text>
                            <Text>{data.productStats.used}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text>Remaining Quantity:</Text>
                            <Text>{data.productStats.remaining}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text>Utilization Rate:</Text>
                            <Text>
                                {data.productStats.assigned > 0 
                                    ? Math.round((data.productStats.used / data.productStats.assigned) * 100) 
                                    : 0}%
                            </Text>
                        </View>
                    </View>

                    {/* Donations Stats */}
                    <Text style={styles.sectionTitle}>Donations Statistics</Text>
                    <View style={styles.breakdownBox}>
                        <View style={styles.breakdownItem}>
                            <Text>Assigned Quantity:</Text>
                            <Text>{data.donationStats.assigned}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text>Used Quantity:</Text>
                            <Text>{data.donationStats.used}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text>Remaining Quantity:</Text>
                            <Text>{data.donationStats.remaining}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text>Utilization Rate:</Text>
                            <Text>
                                {data.donationStats.assigned > 0 
                                    ? Math.round((data.donationStats.used / data.donationStats.assigned) * 100) 
                                    : 0}%
                            </Text>
                        </View>
                    </View>

                    {/* Products Table */}
                    <Text style={styles.sectionTitle}>Products Inventory</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <View style={styles.tableColWide}>
                                <Text style={styles.tableHeaderCell}>Product Name</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Category</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Assigned</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Used</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Remaining</Text>
                            </View>
                        </View>
                        {(data.inventoryItems || [])
                            .filter(item => item && item.type !== 'res')
                            .map((item, index) => (
                            <View style={styles.tableRow} key={index.toString()}>
                                <View style={styles.tableColWide}>
                                    <Text style={styles.tableCell}>{item.productname || 'Unnamed Product'}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.category || 'Uncategorized'}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.assigned || 0}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.used || 0}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.remaining || 0}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Donations Table */}
                    <Text style={styles.sectionTitle}>Donations Inventory</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <View style={styles.tableColWide}>
                                <Text style={styles.tableHeaderCell}>Item Name</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Category</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Assigned</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Used</Text>
                            </View>
                            <View style={styles.tableColNarrow}>
                                <Text style={styles.tableHeaderCell}>Remaining</Text>
                            </View>
                        </View>
                        {(data.inventoryItems || [])
                            .filter(item => item && item.type === 'res')
                            .map((item, index) => (
                            <View style={styles.tableRow} key={index.toString()}>
                                <View style={styles.tableColWide}>
                                    <Text style={styles.tableCell}>
                                        {(item.resourceName || 'Unnamed') + ' (' + (item.resource || 'General') + ')'}
                                    </Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.category || 'Uncategorized'}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.assigned || 0}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.used || 0}</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>{item.remaining || 0}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.note}>
                        This report was automatically generated from your event inventory data for{' '}
                        {data.eventName}.
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        © {currentYear} {data.ngoInfo.name} | Inventory Report for {data.eventName}
                    </Text>
                    <Text style={{ marginTop: 5 }}>Page 1 of 1</Text>
                </View>
            </Page>
        </Document>
    );
}

// Export the component
export default InventoryReportPDF; 