
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2, Save, Lightbulb, ShoppingCart, Package } from "lucide-react";

const contentGeneratorSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  characteristics: z.string().min(10, "Descreva as características do produto (mínimo 10 caracteres)"),
  style: z.string().min(1, "Selecione um estilo de escrita"),
  marketplace: z.string().min(1, "Selecione um marketplace"),
  product_id: z.string().optional(),
});

type ContentGeneratorFormValues = z.infer<typeof contentGeneratorSchema>;

const ContentGeneratorPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    description: string;
    tags: string[];
  } | null>(null);

  const form = useForm<ContentGeneratorFormValues>({
    resolver: zodResolver(contentGeneratorSchema),
    defaultValues: {
      name: "",
      characteristics: "",
      style: "",
      marketplace: "",
      product_id: "",
    }
  });

  const generateContent = async (values: ContentGeneratorFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          name: values.name,
          characteristics: values.characteristics,
          style: values.style,
          marketplace: values.marketplace,
        }
      });

      if (error) throw error;

      setGeneratedContent(data);
      toast({
        title: "Conteúdo gerado com sucesso!",
        description: "O conteúdo foi criado usando IA. Você pode editá-lo antes de salvar.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o conteúdo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    if (!user || !generatedContent) return;

    try {
      const formValues = form.getValues();
      
      const { error } = await supabase
        .from("generated_descriptions")
        .insert({
          user_id: user.id,
          product_id: formValues.product_id || null,
          title: generatedContent.title,
          description: generatedContent.description,
          tags: generatedContent.tags,
          marketplace: formValues.marketplace,
          style: formValues.style,
        });

      if (error) throw error;

      toast({
        title: "Conteúdo salvo!",
        description: "O conteúdo gerado foi salvo com sucesso.",
      });

      // Reset form and generated content
      form.reset();
      setGeneratedContent(null);
    } catch (error: any) {
      console.error("Erro ao salvar conteúdo:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o conteúdo.",
        variant: "destructive"
      });
    }
  };

  const marketplaceTips = {
    shopee: [
      "Use emojis para chamar atenção",
      "Destaque promoções e descontos",
      "Inclua palavras-chave populares",
      "Mencione frete grátis se aplicável",
    ],
    mercado_livre: [
      "Inclua especificações técnicas detalhadas",
      "Mencione garantia e política de devolução",
      "Use palavras-chave específicas da categoria",
      "Destaque benefícios únicos do produto",
    ]
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Gerador de Conteúdo com IA</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Criar Conteúdo
                  </CardTitle>
                  <CardDescription>
                    Preencha as informações do produto para gerar títulos, descrições e tags otimizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(generateContent)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Smartphone Samsung Galaxy A54" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="characteristics"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Características do Produto</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva as principais características, especificações técnicas, benefícios, etc."
                                className="min-h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Quanto mais detalhes você fornecer, melhor será o conteúdo gerado
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="marketplace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marketplace</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o marketplace" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="shopee">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-orange-500" />
                                      Shopee
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="mercado_livre">
                                    <div className="flex items-center gap-2">
                                      <ShoppingCart className="h-4 w-4 text-yellow-500" />
                                      Mercado Livre
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="style"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estilo de Escrita</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o estilo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="persuasivo">Persuasivo</SelectItem>
                                  <SelectItem value="técnico">Técnico</SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                  <SelectItem value="formal">Formal</SelectItem>
                                  <SelectItem value="promocional">Promocional</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Gerando..." : "Gerar Conteúdo"}
                        <Wand2 className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Generated Content */}
              {generatedContent && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Conteúdo Gerado</CardTitle>
                    <CardDescription>
                      Edite o conteúdo conforme necessário antes de salvar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <Input 
                        value={generatedContent.title} 
                        onChange={(e) => setGeneratedContent({
                          ...generatedContent,
                          title: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea 
                        value={generatedContent.description}
                        onChange={(e) => setGeneratedContent({
                          ...generatedContent,
                          description: e.target.value
                        })}
                        className="mt-1 min-h-32"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md">
                        {generatedContent.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button onClick={saveContent} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Versão
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tips Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Dicas por Marketplace
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.watch("marketplace") && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        {form.watch("marketplace") === "shopee" ? (
                          <>
                            <Package className="h-4 w-4 text-orange-500" />
                            Shopee
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 text-yellow-500" />
                            Mercado Livre
                          </>
                        )}
                      </h4>
                      <ul className="text-sm space-y-2">
                        {marketplaceTips[form.watch("marketplace") as keyof typeof marketplaceTips]?.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Dicas Gerais</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        Use palavras-chave relevantes no título
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        Inclua benefícios, não apenas características
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        Seja específico sobre tamanhos e medidas
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        Mencione compatibilidade quando relevante
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default ContentGeneratorPage;
