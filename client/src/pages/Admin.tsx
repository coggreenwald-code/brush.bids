import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { AdminTab } from "@/components/AdminTab";
import { TaxReportTab } from "@/components/TaxReportTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
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
      <div className="space-y-6 pb-16">
        <div style={{ paddingLeft: "10px" }}>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Administration</span>
          <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-admin-title">Admin Portal</h1>
        </div>
        <Tabs defaultValue="curation" className="w-full">
          <TabsList className="bg-white/[0.03] border border-white/5">
            <TabsTrigger value="curation" data-testid="tab-curation">Curation</TabsTrigger>
            <TabsTrigger value="tax" data-testid="tab-tax">Tax Collected</TabsTrigger>
          </TabsList>
          <TabsContent value="curation" className="mt-6">
            <AdminTab />
          </TabsContent>
          <TabsContent value="tax" className="mt-6">
            <TaxReportTab />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </Layout>
  );
}
