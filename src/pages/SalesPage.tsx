
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product, Sale, SaleWithProductAndListing } from "@/lib/types";
import { CartesianGrid, Line, LineChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, BarChart, Bar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon, Loader2, RefreshCcw, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type DateRange = {
  from: Date;
  to: Date;
};

type ProductSales = {
  product_id: string;
  product_name: string;
  total_sales: number;
  total_quantity: number;
  total_profit: number;
};

type MarketplaceSales = {
  marketplace: string;
  total_sales: number;
  total_quantity: number;
};

const SalesPage = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleWithProductAndListing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");

  // Estatísticas calculadas
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [marketplaceSales, setMarketplaceSales] = useState<MarketplaceSales[]>([]);
  const [salesByDate, setSalesByDate] = useState<any[]>([]);

  // Buscar vendas e produtos
  useEffect(() => {
    fetchData();
  }, [user]);

  // Recalcular estatísticas quando os filtros mudarem
  useEffect(() => {
    if (sales.length > 0) {
      calculateStatistics();
    }
  }, [sales, dateRange, marketplaceFilter, filter]);

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

      // Buscar vendas com joins
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          product:products(*),
          marketplace_listing:marketplace_listings(*)
        `)
        .eq("user_id", user.id);

      if (salesError) throw salesError;
      setSales(salesData as SaleWithProductAndListing[] || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de vendas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas com base nos filtros aplicados
  const calculateStatistics = () => {
    // Filtrar vendas pelo período e marketplace
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const matchesDateRange = saleDate >= dateRange.from && saleDate <= dateRange.to;
      const matchesMarketplace = marketplaceFilter === "all" || sale.marketplace === marketplaceFilter;
      const matchesSearch = filter === "" || 
        sale.product?.name.toLowerCase().includes(filter.toLowerCase()) ||
        sale.marketplace_listing?.title.toLowerCase().includes(filter.toLowerCase());
      
      return matchesDateRange && matchesMarketplace && matchesSearch;
    });

    // Calcular totais
    const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const profit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    
    setTotalSales(filteredSales.length);
    setTotalRevenue(revenue);
    setTotalProfit(profit);

    // Calcular vendas por produto
    const productSalesMap = new Map<string, ProductSales>();
    
    filteredSales.forEach(sale => {
      if (!sale.product) return;
      
      const productId = sale.product.id;
      const existing = productSalesMap.get(productId) || {
        product_id: productId,
        product_name: sale.product.name,
        total_sales: 0,
        total_quantity: 0,
        total_profit: 0
      };
      
      existing.total_sales += sale.total;
      existing.total_quantity += sale.quantity;
      existing.total_profit += sale.profit || 0;
      
      productSalesMap.set(productId, existing);
    });
    
    const productSalesArray = Array.from(productSalesMap.values())
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 5); // Top 5 produtos
    
    setProductSales(productSalesArray);

    // Calcular vendas por marketplace
    const marketplaceSalesMap = new Map<string, MarketplaceSales>();
    
    filteredSales.forEach(sale => {
      const marketplace = sale.marketplace;
      const existing = marketplaceSalesMap.get(marketplace) || {
        marketplace,
        total_sales: 0,
        total_quantity: 0
      };
      
      existing.total_sales += sale.total;
      existing.total_quantity += sale.quantity;
      
      marketplaceSalesMap.set(marketplace, existing);
    });
    
    const marketplaceSalesArray = Array.from(marketplaceSalesMap.values());
    setMarketplaceSales(marketplaceSalesArray);

    // Calcular vendas por data
    const salesByDateMap = new Map<string, {date: string, total: number, shopee: number, mercado_livre: number}>();
    
    // Inicializar mapa com todas as datas no período
    let currentDate = new Date(dateRange.from);
    while (currentDate <= dateRange.to) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      salesByDateMap.set(dateStr, {
        date: format(currentDate, "dd/MM"),
        total: 0,
        shopee: 0,
        mercado_livre: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Adicionar dados de vendas
    filteredSales.forEach(sale => {
      const saleDate = format(new Date(sale.sale_date), "yyyy-MM-dd");
      const existing = salesByDateMap.get(saleDate);
      
      if (existing) {
        existing.total += sale.total;
        if (sale.marketplace === "shopee") {
          existing.shopee += sale.total;
        } else if (sale.marketplace === "mercado_livre") {
          existing.mercado_livre += sale.total;
        }
        
        salesByDateMap.set(saleDate, existing);
      }
    });
    
    const salesByDateArray = Array.from(salesByDateMap.values());
    setSalesByDate(salesByDateArray);
  };

  // Formatar moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Componente de calendário para seleção de data
  const DateRangePicker = () => {
    return (
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className="w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({
                    from: range.from,
                    to: range.to,
                  });
                }
              }}
              numberOfMonths={2}
              locale={pt}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // Cores para os gráficos
  const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28", "#9d8ce0"];

  // Filtrar vendas com base nos filtros aplicados
  const getFilteredSales = () => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const matchesDateRange = saleDate >= dateRange.from && saleDate <= dateRange.to;
      const matchesMarketplace = marketplaceFilter === "all" || sale.marketplace === marketplaceFilter;
      const matchesSearch = filter === "" || 
        (sale.product && sale.product.name.toLowerCase().includes(filter.toLowerCase())) ||
        (sale.marketplace_listing && sale.marketplace_listing.title.toLowerCase().includes(filter.toLowerCase()));
      
      return matchesDateRange && matchesMarketplace && matchesSearch;
    });
  };

  const filteredSales = getFilteredSales();

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Vendas</h2>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <DateRangePicker />
            <Select
              value={marketplaceFilter}
              onValueChange={setMarketplaceFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {/* Indicadores principais */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalSales}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalProfit)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de análise */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="sales">Vendas</TabsTrigger>
              <TabsTrigger value="products">Por Produto</TabsTrigger>
            </TabsList>
            
            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              {/* Gráfico de vendas por dia */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Dia</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="shopee" stroke="#0088FE" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="mercado_livre" stroke="#FF8042" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendas por Marketplace */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vendas por Marketplace</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={marketplaceSales}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total_sales"
                          nameKey="marketplace"
                          label={({ marketplace, percent }) => 
                            `${marketplace === "shopee" ? "Shopee" : "Mercado Livre"}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {marketplaceSales.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)} 
                          labelFormatter={(label) => label === "shopee" ? "Shopee" : "Mercado Livre"}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Produtos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Produtos</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productSales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="product_name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="total_sales" name="Vendas" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Lista de Vendas */}
            <TabsContent value="sales">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Marketplace</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            Nenhuma venda encontrada para o período selecionado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>
                              {format(new Date(sale.sale_date), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              {sale.product?.name || "Produto não encontrado"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {sale.marketplace === "shopee" ? "Shopee" : "Mercado Livre"}
                              </Badge>
                            </TableCell>
                            <TableCell>{sale.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(sale.price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(sale.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              {sale.profit !== null
                                ? formatCurrency(sale.profit)
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Análise por Produto */}
            <TabsContent value="products">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : productSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            Nenhuma venda encontrada para o período selecionado
                          </TableCell>
                        </TableRow>
                      ) : (
                        productSales.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total_sales)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.total_quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total_profit)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default SalesPage;
