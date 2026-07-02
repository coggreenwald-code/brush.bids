import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { AdminTab } from "@/components/AdminTab";
import { TaxReportTab } from "@/components/TaxReportTab";
import { EmailLogTab } from "@/components/EmailLogTab";
import { AdminPayoutsTab } from "@/components/AdminPayoutsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="p-8 text-center max-w-md rounded-xl bg-white/[0.02] border border-white/5">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2" data-testid="text-access-denied">Access Denied</h2>
            <p className="text-white/50">You don't have permission to access the admin panel.</p>
          </div>
        </div>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 md:px-8">
        <div style={{ paddingLeft: "10px" }}>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Administration</span>
          <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-admin-title">Admin Portal</h1>
        </div>
        <Tabs defaultValue="curation" className="w-full">
          <TabsList className="bg-white/[0.03] border border-white/5 max-sm:w-full max-sm:justify-start max-sm:overflow-x-auto">
            <TabsTrigger value="curation" data-testid="tab-curation">Curation</TabsTrigger>
            <TabsTrigger value="payouts" data-testid="tab-payouts">Pending Payouts</TabsTrigger>
            <TabsTrigger value="tax" data-testid="tab-tax">Tax Collected</TabsTrigger>
            <TabsTrigger value="email-log" data-testid="tab-email-log">Email Log</TabsTrigger>
          </TabsList>
          <TabsContent value="curation" className="mt-6">
            <AdminTab />
          </TabsContent>
          <TabsContent value="payouts" className="mt-6">
            <AdminPayoutsTab />
          </TabsContent>
          <TabsContent value="tax" className="mt-6">
            <TaxReportTab />
          </TabsContent>
          <TabsContent value="email-log" className="mt-6">
            <EmailLogTab />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </Layout>
  );
}
