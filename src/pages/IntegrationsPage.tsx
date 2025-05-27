
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useIntegrations } from "@/hooks/useIntegrations";
import { ShopeeCard } from "@/components/integrations/ShopeeCard";
import { MercadoLivreCard } from "@/components/integrations/MercadoLivreCard";
import { IntegrationGuide } from "@/components/integrations/IntegrationGuide";

const IntegrationsPage = () => {
  const {
    apiKeys,
    loading,
    connecting,
    handleShopeeConnect,
    handleMercadoLivreConnect,
    handleMercadoLivreRefresh
  } = useIntegrations();

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Carregando integrações...</div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Integrações com Marketplaces</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ShopeeCard 
              apiKeys={apiKeys}
              onConnect={handleShopeeConnect}
            />

            <MercadoLivreCard 
              apiKeys={apiKeys}
              connecting={connecting}
              onConnect={handleMercadoLivreConnect}
              onRefresh={handleMercadoLivreRefresh}
            />
          </div>

          <IntegrationGuide />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default IntegrationsPage;
