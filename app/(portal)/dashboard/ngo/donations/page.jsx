import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonationsDashboard } from "@/components/donations-dashboard"
import { DonationsTransactions } from "@/components/donations-transactions"
import { PayoutManagement } from "@/components/payout-management"
import { DonorsTable } from "@/components/donors-table"

export default function NGODonationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">NGO Donations Dashboard</h1>
      
      {/* Stats and Charts - Always visible */}
      <DonationsDashboard />
      
      {/* Tabs Section - Below Stats and Charts */}
      <div className="mt-8">
        <Tabs defaultValue="donors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>

          </TabsList>
          
          <TabsContent value="donors">
            <DonorsTable />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutManagement />
          </TabsContent>

          <TabsContent value="transactions">
            <DonationsTransactions />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}