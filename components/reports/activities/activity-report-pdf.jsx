import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles
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
});

// Create Document Component
const ActivityReportPDF = ({ reportData }) => (
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
      <Text style={styles.title}>Activities Report</Text>
      <Text style={styles.reportMeta}>
        Time Frame: {reportData.timeFrame} | Generated on: {reportData.date}
      </Text>

      {/* Activities Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities Overview</Text>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Activities</Text>
            <Text style={styles.summaryValue}>
              {reportData.activities.total}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Volunteers Engaged</Text>
            <Text style={styles.summaryValue}>
              {reportData.activities.volunteers}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Participants</Text>
            <Text style={styles.summaryValue}>
              {reportData.activities.participants}
            </Text>
          </View>
        </View>

        {/* Category Breakdown Table */}
        <Text style={styles.sectionTitle}>Activity Breakdown by Category</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeaderCell}>Category</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeaderCell}>Count</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeaderCell}>Volunteers</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeaderCell}>Participants</Text>
            </View>
          </View>

          {/* Table Rows */}
          {reportData.activities.breakdown.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.category}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.count}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.volunteers}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.participants}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Additional insights */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            • Average volunteers per activity:{" "}
            {reportData.activities.volunteers > 0 &&
            reportData.activities.total > 0
              ? (
                  reportData.activities.volunteers / reportData.activities.total
                ).toFixed(1)
              : 0}
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            • Average participants per activity:{" "}
            {reportData.activities.participants > 0 &&
            reportData.activities.total > 0
              ? (
                  reportData.activities.participants /
                  reportData.activities.total
                ).toFixed(1)
              : 0}
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            • Most active category:{" "}
            {reportData.activities.breakdown.length > 0
              ? [...reportData.activities.breakdown].sort(
                  (a, b) => b.count - a.count
                )[0].category
              : "None"}
          </Text>
        </View>

        <Text style={styles.note}>
          This report was automatically generated from your activities data for
          the {reportData.timeFrame.toLowerCase()} period.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          © {new Date().getFullYear()} {reportData.ngoInfo.name} | Activities
          Report for {reportData.timeFrame}
        </Text>
        <Text style={{ marginTop: 5 }}>Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);

export default ActivityReportPDF;
