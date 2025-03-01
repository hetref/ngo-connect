import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

// Create styles (using the same styles as activity report)
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
        marginBottom: 20,
        color: "#333",
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
    detailedTable: {
        marginTop: 20,
    },
    chartContainer: {
        height: 400,
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    tableColSmall: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#eaeaea",
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColLarge: {
        width: "30%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#eaeaea",
        borderLeftWidth: 0,
        borderTopWidth: 0,
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
});

// Wrap the component in React.memo for better performance
const DonationReportPDF = React.memo(({ reportData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header with organization info */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.organization}>
                        <Text style={styles.ngoName}>{reportData.ngoInfo.name}</Text>
                        <Text style={styles.ngoDetails}>{reportData.ngoInfo.address}</Text>
                        <Text style={styles.ngoDetails}>{reportData.ngoInfo.email}</Text>
                    </View>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoPlaceholder}>LOGO</Text>
                    </View>
                </View>
            </View>

            {/* Report Title */}
            <Text style={styles.title}>Donations Report</Text>
            <Text style={styles.reportMeta}>
                Time Frame: {reportData.timeFrame} | Generated on: {reportData.date}
            </Text>

            {/* Donations Overview Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Donations Overview</Text>

                {/* Summary boxes */}
                <View style={styles.summary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Cash & Online</Text>
                        <Text style={styles.summaryValue}>
                            ₹{reportData.total.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Crypto</Text>
                        <Text style={styles.summaryValue}>
                            {reportData.cryptoTotal.toLocaleString()} Tokens
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Donors</Text>
                        <Text style={styles.summaryValue}>
                            {reportData.totalDonors}
                        </Text>
                    </View>
                </View>

                {/* Donation Breakdown */}
                <Text style={styles.sectionTitle}>Donation Breakdown</Text>
                <View style={styles.breakdownBox}>
                    {reportData.breakdown.map((item, index) => (
                        <View style={styles.breakdownItem} key={index}>
                            <Text>{item.method}</Text>
                            <Text>
                                {item.method === 'Crypto' 
                                    ? `${item.amount.toLocaleString()} Tokens`
                                    : `₹${item.amount.toLocaleString()}`}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Cash Donations Table */}
                <Text style={styles.sectionTitle}>Cash Donations</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Name</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Amount</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Date</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Method</Text>
                        </View>
                    </View>
                    {reportData.cashDonations.map((donation, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.name}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>₹{Number(donation.amount).toLocaleString()}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.donatedOn}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.paymentMethod}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Online/UPI Donations Table */}
                <Text style={styles.sectionTitle}>UPI Donations</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Name</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Amount</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Date</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Method</Text>
                        </View>
                    </View>
                    {reportData.onlineDonations.map((donation, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.name}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>₹{Number(donation.amount).toLocaleString()}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{new Date(donation.id).toISOString().split('T')[0]}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.paymentMethod}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Crypto Donations Table */}
                <Text style={styles.sectionTitle}>Cryptocurrency Donations</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Name</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Tokens</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Date</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeaderCell}>Method</Text>
                        </View>
                    </View>
                    {reportData.cryptoDonations.map((donation, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.name}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.amount}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{new Date(donation.id).toISOString().split('T')[0]}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{donation.paymentMethod}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={styles.note}>
                    This report was automatically generated from your donations data for
                    the {reportData.timeFrame.toLowerCase()} period.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>
                    © {new Date().getFullYear()} {reportData.ngoInfo.name} | Donations
                    Report for {reportData.timeFrame}
                </Text>
                <Text style={{ marginTop: 5 }}>Page 1 of 1</Text>
            </View>
        </Page>
    </Document>
));

// Add a display name for better debugging
DonationReportPDF.displayName = 'DonationReportPDF';

export default DonationReportPDF;