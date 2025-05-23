
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKey, Profile } from "@/lib/types";
import { KeyRound, User } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const userSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

const apiKeysSchema = z.object({
  openai_key: z.string().optional(),
  shopee_key: z.string().optional(),
  mercado_livre_key: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;
type ApiKeysFormValues = z.infer<typeof apiKeysSchema>;

const SettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingApiKeys, setSavingApiKeys] = useState(false);

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
    }
  });

  const apiKeysForm = useForm<ApiKeysFormValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      openai_key: "",
      shopee_key: "",
      mercado_livre_key: "",
    }
  });

  // Buscar dados do perfil e das chaves de API
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Buscar perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        userForm.reset({
          email: profileData.email || "",
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
        });

        // Buscar chaves de API
        const { data: apiKeysData, error: apiKeysError } = await supabase
          .from("api_keys")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (apiKeysError && apiKeysError.code !== "PGRST116") throw apiKeysError;
        setApiKeys(apiKeysData || null);
        
        if (apiKeysData) {
          apiKeysForm.reset({
            openai_key: apiKeysData.openai_key || "",
            shopee_key: apiKeysData.shopee_key || "",
            mercado_livre_key: apiKeysData.mercado_livre_key || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas informações",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Atualizar perfil
  const updateProfile = async (data: UserFormValues) => {
    if (!user || !profile) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar suas informações",
        variant: "destructive"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Atualizar chaves de API
  const updateApiKeys = async (data: ApiKeysFormValues) => {
    if (!user) return;

    setSavingApiKeys(true);
    try {
      if (apiKeys) {
        // Atualizar chaves existentes
        const { error } = await supabase
          .from("api_keys")
          .update({
            openai_key: data.openai_key || null,
            shopee_key: data.shopee_key || null,
            mercado_livre_key: data.mercado_livre_key || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", apiKeys.id);

        if (error) throw error;
      } else {
        // Criar novas chaves
        const { data: newApiKeys, error } = await supabase
          .from("api_keys")
          .insert({
            user_id: user.id,
            openai_key: data.openai_key || null,
            shopee_key: data.shopee_key || null,
            mercado_livre_key: data.mercado_livre_key || null,
          })
          .select()
          .single();

        if (error) throw error;
        setApiKeys(newApiKeys);
      }

      toast({
        title: "Chaves de API atualizadas",
        description: "Suas chaves de API foram salvas com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao atualizar chaves de API:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar suas chaves de API",
        variant: "destructive"
      });
    } finally {
      setSavingApiKeys(false);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Configurações</h2>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="api-keys">Chaves de API</TabsTrigger>
            </TabsList>

            {/* Aba de Perfil */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Perfil
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(updateProfile)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              O email não pode ser alterado.
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sobrenome</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu sobrenome" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Chaves de API */}
            <TabsContent value="api-keys">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Chaves de API
                  </CardTitle>
                  <CardDescription>
                    Configure suas chaves de API para integração com serviços externos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...apiKeysForm}>
                    <form onSubmit={apiKeysForm.handleSubmit(updateApiKeys)} className="space-y-4">
                      <FormField
                        control={apiKeysForm.control}
                        name="openai_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave da OpenAI</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="sk-..." 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormDescription>
                              Necessária para o Gerador de Conteúdo com IA
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={apiKeysForm.control}
                        name="shopee_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave da API da Shopee</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Chave de API da Shopee" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormDescription>
                              Necessária para integração com a Shopee
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={apiKeysForm.control}
                        name="mercado_livre_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave da API do Mercado Livre</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Chave de API do Mercado Livre" 
                                {...field}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormDescription>
                              Necessária para integração com o Mercado Livre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={savingApiKeys}>
                        {savingApiKeys ? "Salvando..." : "Salvar Chaves de API"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default SettingsPage;
