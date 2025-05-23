
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Product } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, HelpCircle, Loader2, Save } from "lucide-react";

const PricerPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  
  // Variáveis para cálculo de preço
  const [productCost, setProductCost] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [marketplaceFee, setMarketplaceFee] = useState<number>(10); // Porcentagem
  const [profitMargin, setProfitMargin] = useState<number>(30); // Porcentagem
  const [marketplace, setMarketplace] = useState<string>("shopee");
  
  // Resultados calculados
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [breakdown, setBreakdown] = useState({
    totalCost: 0,
    marketplaceFeeAmount: 0,
    profitAmount: 0
  });
  
  // Carregar produtos
  useEffect(() => {
    fetchProducts();
  }, [user]);
  
  const fetchProducts = async () => {
    if (!user) return;
    
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive"
      });
    } finally {
      setLoadingProducts(false);
      setLoading(false);
    }
  };
  
  // Selecionar um produto
  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const selected = products.find(p => p.id === productId);
    
    if (selected && selected.cost) {
      setProductCost(selected.cost);
      calculatePrice(selected.cost, shippingCost, marketplaceFee, profitMargin);
    } else {
      setProductCost(0);
      calculatePrice(0, shippingCost, marketplaceFee, profitMargin);
    }
  };
  
  // Calcular preço
  const calculatePrice = (cost: number, shipping: number, fee: number, profit: number) => {
    const totalCost = cost + shipping;
    const basePrice = totalCost / (1 - (fee / 100));
    const withProfit = basePrice / (1 - (profit / 100));
    const roundedPrice = Math.ceil(withProfit * 100) / 100;
    
    const marketplaceFeeAmount = roundedPrice * (fee / 100);
    const profitAmount = roundedPrice - totalCost - marketplaceFeeAmount;
    
    setCalculatedPrice(roundedPrice);
    setBreakdown({
      totalCost: totalCost,
      marketplaceFeeAmount: marketplaceFeeAmount,
      profitAmount: profitAmount
    });
  };
  
  // Recalcular quando os valores mudarem
  useEffect(() => {
    calculatePrice(productCost, shippingCost, marketplaceFee, profitMargin);
  }, [productCost, shippingCost, marketplaceFee, profitMargin]);
  
  // Atualizar configurações do marketplace
  const updateMarketplaceSettings = (marketplace: string) => {
    setMarketplace(marketplace);
    
    // Definir taxas padrão com base no marketplace
    if (marketplace === "shopee") {
      setMarketplaceFee(10);
    } else if (marketplace === "mercado_livre") {
      setMarketplaceFee(16);
    }
  };
  
  // Salvar preço do produto
  const savePrice = async () => {
    if (!user || !selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from("products")
        .update({ price: calculatedPrice })
        .eq("id", selectedProduct);
      
      if (error) throw error;
      
      // Atualizar o produto na lista local
      setProducts(products.map(p => 
        p.id === selectedProduct 
          ? { ...p, price: calculatedPrice } 
          : p
      ));
      
      toast({
        title: "Preço atualizado",
        description: "O preço do produto foi atualizado com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao atualizar preço:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o preço",
        variant: "destructive"
      });
    }
  };
  
  // Formatar moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Precificador Inteligente</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de cálculo */}
            <Card>
              <CardHeader>
                <CardTitle>Calcular Preço</CardTitle>
                <CardDescription>
                  Defina os parâmetros para calcular o preço ideal do seu produto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product">Produto</Label>
                    <Select 
                      value={selectedProduct} 
                      onValueChange={handleProductSelect}
                      disabled={loadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : products.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Nenhum produto encontrado
                          </div>
                        ) : (
                          products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marketplace">Marketplace</Label>
                    <Select 
                      value={marketplace} 
                      onValueChange={updateMarketplaceSettings}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shopee">Shopee</SelectItem>
                        <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="product-cost">Custo do Produto</Label>
                      <span className="text-sm">{formatCurrency(productCost)}</span>
                    </div>
                    <Input
                      id="product-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productCost}
                      onChange={(e) => setProductCost(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="shipping-cost">Custo de Frete</Label>
                      <span className="text-sm">{formatCurrency(shippingCost)}</span>
                    </div>
                    <Input
                      id="shipping-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="marketplace-fee">Taxa do Marketplace ({marketplaceFee}%)</Label>
                      <span className="text-sm">{formatCurrency(breakdown.marketplaceFeeAmount)}</span>
                    </div>
                    <Slider
                      id="marketplace-fee"
                      min={0}
                      max={30}
                      step={0.5}
                      value={[marketplaceFee]}
                      onValueChange={(value) => setMarketplaceFee(value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="profit-margin">Margem de Lucro ({profitMargin}%)</Label>
                      <span className="text-sm">{formatCurrency(breakdown.profitAmount)}</span>
                    </div>
                    <Slider
                      id="profit-margin"
                      min={0}
                      max={100}
                      step={1}
                      value={[profitMargin]}
                      onValueChange={(value) => setProfitMargin(value[0])}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={savePrice}
                    disabled={!selectedProduct || calculatedPrice <= 0} 
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Preço
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Resultado */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-50 to-green-50">
                <CardHeader>
                  <CardTitle>Preço Sugerido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <span className="text-5xl font-bold">{formatCurrency(calculatedPrice)}</span>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between">
                      <span>Custo Total (Produto + Frete)</span>
                      <span className="font-medium">{formatCurrency(breakdown.totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa do Marketplace ({marketplaceFee}%)</span>
                      <span className="font-medium">{formatCurrency(breakdown.marketplaceFeeAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucro ({profitMargin}%)</span>
                      <span className="font-medium">{formatCurrency(breakdown.profitAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Dicas de Precificação</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="general">
                    <TabsList>
                      <TabsTrigger value="general">Geral</TabsTrigger>
                      <TabsTrigger value="shopee">Shopee</TabsTrigger>
                      <TabsTrigger value="mercado-livre">Mercado Livre</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="space-y-4 mt-4">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Pesquise o preço da concorrência para produtos similares</li>
                        <li>Considere usar preços psicológicos (ex: R$ 99,90 em vez de R$ 100,00)</li>
                        <li>Leve em conta a sazonalidade ao definir seus preços</li>
                        <li>Não se esqueça de considerar custos adicionais como embalagem e etiquetas</li>
                      </ul>
                    </TabsContent>
                    <TabsContent value="shopee" className="space-y-4 mt-4">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>A Shopee cobra uma taxa de serviço de aproximadamente 10%</li>
                        <li>Ofereça descontos para as primeiras vendas para melhorar seu ranking</li>
                        <li>Participe dos programas de frete grátis para atrair mais clientes</li>
                        <li>Utilize as promoções da plataforma para aumentar a visibilidade</li>
                      </ul>
                    </TabsContent>
                    <TabsContent value="mercado-livre" className="space-y-4 mt-4">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>O Mercado Livre cobra aproximadamente 16% de taxa por venda</li>
                        <li>Os anúncios "Clássicos" não pagam mensalidade, apenas taxa por venda</li>
                        <li>Anúncios "Premium" têm maior visibilidade, mas taxas maiores</li>
                        <li>O Mercado Envios pode reduzir seus custos de frete</li>
                      </ul>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default PricerPage;
