import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
  },
})

// Create Document Component
const PDFTemplate = ({ reportData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>NGO Comprehensive Report</Text>
        <Text style={styles.subtitle}>Time Frame: {reportData.timeFrame}</Text>

        <Text style={styles.subtitle}>Donation Summary</Text>
        <Text style={styles.text}>Total Donations: ₹{reportData.donations.total.toLocaleString()}</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Method</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Amount</Text>
            </View>
          </View>
          {reportData.donations.breakdown.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.method}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>₹{item.amount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.subtitle}>Activities Summary</Text>
        <Text style={styles.text}>Total Activities: {reportData.activities.total}</Text>
        <Text style={styles.text}>Volunteers Engaged: {reportData.activities.volunteers}</Text>
        <Text style={styles.text}>Funds Spent: ₹{reportData.activities.fundsSpent.toLocaleString()}</Text>

        <Text style={styles.subtitle}>Member Summary</Text>
        <Text style={styles.text}>Total Members: {reportData.members.totalMembers}</Text>
        <Text style={styles.text}>New Members: {reportData.members.newMembers}</Text>
      </View>
    </Page>
  </Document>
)

export default PDFTemplate

