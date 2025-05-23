
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();

  // Se o usuário estiver autenticado, redirecionar para o dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Social Peepers AI Hub</h1>
          <Button asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-r from-blue-500 to-purple-600 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Gerencie suas vendas em marketplaces com IA</h2>
            <p className="text-xl max-w-2xl mx-auto mb-10">
              Plataforma completa para gerenciar anúncios da Shopee e Mercado Livre, 
              gerar descrições com IA e otimizar seus preços para maximizar lucros.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">Começar Agora</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-500 text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Dashboard Completo</h3>
                <p className="text-gray-600">
                  Visualize vendas por canal, produtos com maior desempenho e receba alertas de estoque baixo.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-500 text-4xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold mb-2">Catálogo Unificado</h3>
                <p className="text-gray-600">
                  Gerencie produtos e anúncios da Shopee e Mercado Livre em um só lugar.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-500 text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2">Gerador de Conteúdo com IA</h3>
                <p className="text-gray-600">
                  Crie descrições otimizadas para marketplaces com apenas alguns cliques usando IA.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-500 text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold mb-2">Precificador Inteligente</h3>
                <p className="text-gray-600">
                  Calcule o preço ideal considerando custos, taxas e margem de lucro desejada.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Pronto para otimizar suas vendas?</h2>
            <Button size="lg" asChild>
              <Link to="/auth">Criar Conta Gratuita</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Social Peepers AI Hub - A plataforma para vendedores de marketplace</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
