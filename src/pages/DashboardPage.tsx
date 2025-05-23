
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { Product, Sale } from "@/lib/types";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DashboardPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Buscar produtos
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id);

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Buscar vendas
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("user_id", user.id);

        if (salesError) throw salesError;
        setSales(salesData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Dados para gráficos (mock inicialmente, depois serão substituídos por dados reais)
  const salesByChannel = [
    { name: "Shopee", value: sales.filter(s => s.marketplace === "shopee").length || 5 },
    { name: "Mercado Livre", value: sales.filter(s => s.marketplace === "mercado_livre").length || 8 }
  ];

  const salesTrend = [
    { name: "Jan", shopee: 4, mercado_livre: 3 },
    { name: "Fev", shopee: 3, mercado_livre: 5 },
    { name: "Mar", shopee: 5, mercado_livre: 6 },
    { name: "Abr", shopee: 7, mercado_livre: 4 },
    { name: "Mai", shopee: 6, mercado_livre: 7 },
    { name: "Jun", shopee: 8, mercado_livre: 8 },
  ];

  const topProducts = [
    { name: "Produto 1", vendas: 12 },
    { name: "Produto 2", vendas: 9 },
    { name: "Produto 3", vendas: 8 },
    { name: "Produto 4", vendas: 6 },
    { name: "Produto 5", vendas: 5 },
  ];

  // Cores para os gráficos
  const COLORS = ["#0088FE", "#FF8042"];

  // Produtos com estoque baixo (menos que 5 unidades)
  const lowStockProducts = products.filter((p) => p.stock !== null && p.stock < 5);

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Dashboard</h2>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{products.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sales.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Shopee</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sales.filter(s => s.marketplace === "shopee").length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Mercado Livre</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sales.filter(s => s.marketplace === "mercado_livre").length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByChannel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {salesByChannel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendência de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="shopee" stroke="#0088FE" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="mercado_livre" stroke="#FF8042" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="vendas" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <Alert key={product.id} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Estoque Baixo</AlertTitle>
                        <AlertDescription>
                          {product.name}: {product.stock} unidade(s) em estoque
                        </AlertDescription>
                      </Alert>
                    ))
                  ) : (
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertTitle>Estoque Saudável</AlertTitle>
                      <AlertDescription>
                        Todos os produtos possuem estoque suficiente.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default DashboardPage;
