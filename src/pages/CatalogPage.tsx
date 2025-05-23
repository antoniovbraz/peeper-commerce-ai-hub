
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Product, MarketplaceListing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Edit, Pause, Play, PlusCircle, RefreshCcw, Search, Trash2 } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  sku: z.string().optional(),
  cost: z.number().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),
  category: z.string().optional()
});

const listingSchema = z.object({
  marketplace: z.string().min(1, "Marketplace é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Preço é obrigatório"),
  status: z.string().min(1, "Status é obrigatório")
});

type ProductFormValues = z.infer<typeof productSchema>;
type ListingFormValues = z.infer<typeof listingSchema>;

const CatalogPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMarketplace, setFilterMarketplace] = useState("all");
  
  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isListingDialogOpen, setIsListingDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentListing, setCurrentListing] = useState<MarketplaceListing | null>(null);
  
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      cost: undefined,
      price: undefined,
      stock: undefined,
      category: ""
    }
  });
  
  const listingForm = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      marketplace: "",
      title: "",
      description: "",
      price: undefined,
      status: "active"
    }
  });
  
  useEffect(() => {
    fetchData();
  }, [user]);
  
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
      
      // Buscar anúncios
      const { data: listingsData, error: listingsError } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("user_id", user.id);
      
      if (listingsError) throw listingsError;
      setListings(listingsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do catálogo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Produtos filtrados
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(filter.toLowerCase()) ||
    product.sku?.toLowerCase().includes(filter.toLowerCase()) ||
    product.category?.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Anúncios filtrados
  const filteredListings = listings.filter(listing => {
    const matchesFilter = 
      listing.title.toLowerCase().includes(filter.toLowerCase()) ||
      listing.marketplace.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || listing.status === filterStatus;
    const matchesMarketplace = filterMarketplace === "all" || listing.marketplace === filterMarketplace;
    
    return matchesFilter && matchesStatus && matchesMarketplace;
  });
  
  // Manipuladores de produto
  const handleCreateProduct = async (data: ProductFormValues) => {
    if (!user) return;
    
    try {
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description || null,
          sku: data.sku || null,
          cost: data.cost || null,
          price: data.price || null,
          stock: data.stock || 0,
          category: data.category || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProducts([...products, newProduct as Product]);
      setIsProductDialogOpen(false);
      productForm.reset();
      
      toast({
        title: "Produto criado",
        description: "O produto foi adicionado com sucesso ao catálogo."
      });
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o produto",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateProduct = async (data: ProductFormValues) => {
    if (!user || !currentProduct) return;
    
    try {
      const { data: updatedProduct, error } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description || null,
          sku: data.sku || null,
          cost: data.cost || null,
          price: data.price || null,
          stock: data.stock || 0,
          category: data.category || null
        })
        .eq("id", currentProduct.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProducts(products.map(p => p.id === currentProduct.id ? updatedProduct as Product : p));
      setIsProductDialogOpen(false);
      setCurrentProduct(null);
      productForm.reset();
      
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o produto",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o produto",
        variant: "destructive"
      });
    }
  };
  
  // Manipuladores de anúncios
  const handleCreateListing = async (data: ListingFormValues) => {
    if (!user || !currentProduct) return;
    
    try {
      const { data: newListing, error } = await supabase
        .from("marketplace_listings")
        .insert({
          user_id: user.id,
          product_id: currentProduct.id,
          marketplace: data.marketplace,
          title: data.title,
          description: data.description || null,
          price: data.price || 0,
          status: data.status,
          url: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setListings([...listings, newListing as MarketplaceListing]);
      setIsListingDialogOpen(false);
      listingForm.reset();
      
      toast({
        title: "Anúncio criado",
        description: "O anúncio foi criado com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao criar anúncio:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o anúncio",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateListing = async (data: ListingFormValues) => {
    if (!user || !currentListing) return;
    
    try {
      const { data: updatedListing, error } = await supabase
        .from("marketplace_listings")
        .update({
          marketplace: data.marketplace,
          title: data.title,
          description: data.description || null,
          price: data.price || 0,
          status: data.status
        })
        .eq("id", currentListing.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setListings(listings.map(l => l.id === currentListing.id ? updatedListing as MarketplaceListing : l));
      setIsListingDialogOpen(false);
      setCurrentListing(null);
      listingForm.reset();
      
      toast({
        title: "Anúncio atualizado",
        description: "O anúncio foi atualizado com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao atualizar anúncio:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o anúncio",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .delete()
        .eq("id", listingId);
      
      if (error) throw error;
      
      setListings(listings.filter(l => l.id !== listingId));
      toast({
        title: "Anúncio excluído",
        description: "O anúncio foi removido com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao excluir anúncio:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o anúncio",
        variant: "destructive"
      });
    }
  };
  
  const handleToggleListingStatus = async (listing: MarketplaceListing) => {
    const newStatus = listing.status === "active" ? "paused" : "active";
    
    try {
      const { data: updatedListing, error } = await supabase
        .from("marketplace_listings")
        .update({
          status: newStatus
        })
        .eq("id", listing.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setListings(listings.map(l => l.id === listing.id ? updatedListing as MarketplaceListing : l));
      
      toast({
        title: "Status atualizado",
        description: `O anúncio foi ${newStatus === "active" ? "ativado" : "pausado"} com sucesso.`
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };
  
  const openProductDialog = (product?: Product) => {
    if (product) {
      setIsEditMode(true);
      setCurrentProduct(product);
      productForm.reset({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        cost: product.cost || undefined,
        price: product.price || undefined,
        stock: product.stock || undefined,
        category: product.category || ""
      });
    } else {
      setIsEditMode(false);
      setCurrentProduct(null);
      productForm.reset();
    }
    setIsProductDialogOpen(true);
  };
  
  const openListingDialog = (product: Product, listing?: MarketplaceListing) => {
    setCurrentProduct(product);
    
    if (listing) {
      setIsEditMode(true);
      setCurrentListing(listing);
      listingForm.reset({
        marketplace: listing.marketplace,
        title: listing.title,
        description: listing.description || "",
        price: listing.price,
        status: listing.status
      });
    } else {
      setIsEditMode(false);
      setCurrentListing(null);
      listingForm.reset({
        marketplace: "",
        title: product.name || "",
        description: product.description || "",
        price: product.price || undefined,
        status: "active"
      });
    }
    setIsListingDialogOpen(true);
  };
  
  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };
  
  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Catálogo</h2>
            <Button onClick={() => openProductDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="listings">Anúncios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <Card className="p-4">
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar produtos..." 
                      className="pl-8" 
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <Button onClick={fetchData} variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead>Anúncios</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Carregando produtos...</TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Nenhum produto encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const productListings = listings.filter(l => l.product_id === product.id);
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku || "-"}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell className="text-right">
                              {product.cost ? `R$ ${product.cost}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.price ? `R$ ${product.price}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">{product.stock || 0}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {productListings.length > 0 ? (
                                  productListings.map((listing) => (
                                    <Badge 
                                      key={listing.id} 
                                      variant={listing.status === "active" ? "default" : "secondary"}
                                      className="cursor-pointer"
                                      onClick={() => openListingDialog(product, listing)}
                                    >
                                      {listing.marketplace}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">Sem anúncios</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="icon" onClick={() => openProductDialog(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => openListingDialog(product)}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
            
            <TabsContent value="listings">
              <Card className="p-4">
                <div className="flex justify-between mb-4">
                  <div className="flex space-x-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar anúncios..." 
                        className="pl-8" 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                    </div>
                    <Select 
                      value={filterMarketplace} 
                      onValueChange={setFilterMarketplace}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os canais</SelectItem>
                        <SelectItem value="shopee">Shopee</SelectItem>
                        <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={filterStatus} 
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={fetchData} variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Carregando anúncios...</TableCell>
                      </TableRow>
                    ) : filteredListings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Nenhum anúncio encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredListings.map((listing) => {
                        const product = getProductById(listing.product_id);
                        
                        return (
                          <TableRow key={listing.id}>
                            <TableCell>{product?.name || "Produto não encontrado"}</TableCell>
                            <TableCell className="font-medium">{listing.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {listing.marketplace === "shopee" ? "Shopee" : "Mercado Livre"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">R$ {listing.price}</TableCell>
                            <TableCell>
                              <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                                {listing.status === "active" ? "Ativo" : "Pausado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleToggleListingStatus(listing)}
                              >
                                {listing.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => product && openListingDialog(product, listing)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleDeleteListing(listing.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Diálogo de produto */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Atualize os detalhes do produto abaixo." 
                  : "Preencha os detalhes do novo produto abaixo."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(isEditMode ? handleUpdateProduct : handleCreateProduct)} className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <FormField
                    control={productForm.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="SKU do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Categoria" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex gap-4">
                  <FormField
                    control={productForm.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Custo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Preço</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Estoque</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {isEditMode ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de anúncio */}
        <Dialog open={isListingDialogOpen} onOpenChange={setIsListingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Anúncio" : "Novo Anúncio"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Atualize os detalhes do anúncio abaixo." 
                  : `Criando anúncio para: ${currentProduct?.name}`}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...listingForm}>
              <form onSubmit={listingForm.handleSubmit(isEditMode ? handleUpdateListing : handleCreateListing)} className="space-y-4">
                <FormField
                  control={listingForm.control}
                  name="marketplace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketplace</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isEditMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o marketplace" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="shopee">Shopee</SelectItem>
                          <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={listingForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do anúncio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={listingForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do anúncio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={listingForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={listingForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="paused">Pausado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    {isEditMode ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Layout>
    </AuthGuard>
  );
};

export default CatalogPage;
