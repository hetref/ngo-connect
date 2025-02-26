import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationsDashboard } from "@/components/donations-dashboard";
import { DonationsTransactions } from "@/components/donations-transactions";
import { PayoutManagement } from "@/components/payout-management";
import { DonorsTable } from "@/components/donors-table";

import CashDonation from "@/components/ngo/CashDonation";
import { CashDonationTable } from "@/components/CashDonationTable";

export default function NGODonationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">NGO Donations Dashboard</h1>

        <CashDonation />
      </div>

      {/* Stats and Charts - Always visible */}
      <DonationsDashboard />

      {/* Tabs Section - Below Stats and Charts */}
      <div className="mt-8">
        <Tabs defaultValue="donors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="donors">
            <DonorsTable />
          </TabsContent>

          <TabsContent value="cash">
            <CashDonationTable />
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
  );
}
