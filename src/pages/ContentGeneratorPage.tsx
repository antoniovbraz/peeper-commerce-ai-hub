
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiKey } from "@/lib/types";
import { Clipboard, Loader2, Sparkles } from "lucide-react";

const ContentGeneratorPage = () => {
  const { user } = useAuth();
  const [productName, setProductName] = useState("");
  const [productFeatures, setProductFeatures] = useState("");
  const [marketplace, setMarketplace] = useState("shopee");
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyFound, setApiKeyFound] = useState<boolean | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  // Verificar se o usuário tem uma chave da OpenAI
  const checkForApiKey = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("openai_key")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setApiKeyFound(!!data.openai_key);
      setNeedsApiKey(!data.openai_key);
    } catch (error) {
      console.error("Erro ao verificar chave de API:", error);
      setApiKeyFound(false);
      setNeedsApiKey(true);
    }
  };

  // Chamar a verificação quando o componente é montado
  useState(() => {
    checkForApiKey();
  });

  const generateContent = async () => {
    if (!user) return;
    
    if (!productName || !productFeatures) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e as características do produto.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Buscar a chave da API
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("openai_key")
        .eq("user_id", user.id)
        .single();
      
      if (apiKeyError || !apiKeyData?.openai_key) {
        toast({
          title: "Chave de API não encontrada",
          description: "Configure sua chave da OpenAI nas configurações.",
          variant: "destructive"
        });
        setNeedsApiKey(true);
        setLoading(false);
        return;
      }
      
      // Construir o prompt para o modelo de IA
      const prompt = `Crie uma descrição otimizada para um produto no ${
        marketplace === "shopee" ? "Shopee" : "Mercado Livre"
      } com o seguinte nome: "${productName}". 
      
      Características do produto:
      ${productFeatures}
      
      A descrição deve ser persuasiva, destacar os benefícios, usar palavras-chave relevantes para SEO e ter formato adequado para marketplace, com características destacadas e formatação que chame atenção dos compradores.`;
      
      // Fazer a chamada para a API da OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyData.openai_key}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Você é um especialista em marketing e vendas em marketplaces. Sua função é criar descrições persuasivas para produtos."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao gerar conteúdo");
      }
      
      const data = await response.json();
      const generatedText = data.choices[0].message.content;
      
      setGeneratedContent(generatedText);
      
      toast({
        title: "Conteúdo gerado com sucesso",
        description: "A descrição do produto foi criada."
      });
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo:", error);
      toast({
        title: "Erro na geração de conteúdo",
        description: error.message || "Não foi possível gerar o conteúdo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copiado!",
      description: "O conteúdo foi copiado para a área de transferência."
    });
  };
  
  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Gerador de Conteúdo</h2>
          </div>
          
          {needsApiKey ? (
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Sparkles className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="text-xl font-medium">Chave da OpenAI Necessária</h3>
                <p className="text-muted-foreground">
                  Para usar o gerador de conteúdo com IA, você precisa configurar sua chave da API da OpenAI.
                </p>
                <Button asChild>
                  <a href="/settings">Configurar Chave da API</a>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário de entrada */}
              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Nome do Produto</Label>
                  <Input 
                    id="product-name" 
                    placeholder="Ex: Fone de Ouvido Bluetooth XYZ" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="product-features">Características do Produto</Label>
                  <Textarea 
                    id="product-features" 
                    placeholder="Liste as características, benefícios e especificações técnicas do produto" 
                    rows={8}
                    value={productFeatures}
                    onChange={(e) => setProductFeatures(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="marketplace">Marketplace</Label>
                  <Select 
                    value={marketplace} 
                    onValueChange={setMarketplace}
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
                
                <Button 
                  onClick={generateContent} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Descrição com IA
                    </>
                  )}
                </Button>
              </Card>
              
              {/* Resultado gerado */}
              <Card className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Descrição Gerada</h3>
                  {generatedContent && (
                    <Button variant="outline" onClick={copyToClipboard}>
                      <Clipboard className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  )}
                </div>
                
                <div className="min-h-[300px] border rounded-md p-4 bg-gray-50 whitespace-pre-wrap">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="mr-2 h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : generatedContent ? (
                    generatedContent
                  ) : (
                    <p className="text-muted-foreground text-center mt-12">
                      A descrição gerada aparecerá aqui. Preencha os campos à esquerda e clique em "Gerar Descrição com IA".
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}
          
          {/* Dicas de uso */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Dicas para Melhores Resultados</h3>
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Dicas Gerais</TabsTrigger>
                <TabsTrigger value="shopee">Shopee</TabsTrigger>
                <TabsTrigger value="mercado-livre">Mercado Livre</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 mt-4">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Seja detalhado nas características do produto</li>
                  <li>Inclua especificações técnicas importantes</li>
                  <li>Mencione os benefícios principais para o usuário</li>
                  <li>Fale sobre materiais, dimensões e garantia</li>
                  <li>Destaque o que diferencia seu produto da concorrência</li>
                </ul>
              </TabsContent>
              <TabsContent value="shopee" className="space-y-4 mt-4">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Títulos curtos e objetivos funcionam melhor (até 60 caracteres)</li>
                  <li>Use emojis para destacar pontos importantes</li>
                  <li>Organize em tópicos com formatação simples</li>
                  <li>Inclua palavras como "Promoção", "Frete Grátis" ou "Garantia"</li>
                  <li>Indique variações disponíveis de forma clara</li>
                </ul>
              </TabsContent>
              <TabsContent value="mercado-livre" className="space-y-4 mt-4">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Títulos mais detalhados (até 60 palavras)</li>
                  <li>Use formatação HTML para destacar informações</li>
                  <li>Inclua tabelas de especificações quando possível</li>
                  <li>Detalhe a política de garantia e devolução</li>
                  <li>Use recursos visuais como listas numeradas e marcadores</li>
                </ul>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default ContentGeneratorPage;
