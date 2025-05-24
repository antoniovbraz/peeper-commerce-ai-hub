
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Key, Users, BarChart3, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const adminSettingsSchema = z.object({
  openai_api_key: z.string().optional(),
});

type AdminSettingsFormValues = z.infer<typeof adminSettingsSchema>;

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalGeneratedDescriptions: 0,
  });

  const form = useForm<AdminSettingsFormValues>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: {
      openai_api_key: "",
    }
  });

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Buscar configurações atuais
        const { data: settings, error: settingsError } = await supabase
          .from("system_settings")
          .select("*")
          .eq("key", "openai_api_key")
          .maybeSingle();

        if (settingsError && settingsError.code !== "PGRST116") throw settingsError;

        if (settings?.value) {
          form.setValue("openai_api_key", "***" + settings.value.slice(-4));
        }

        // Buscar estatísticas
        const [usersResult, productsResult, salesResult, descriptionsResult] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("sales").select("id", { count: "exact", head: true }),
          supabase.from("generated_descriptions").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          totalUsers: usersResult.count || 0,
          totalProducts: productsResult.count || 0,
          totalSales: salesResult.count || 0,
          totalGeneratedDescriptions: descriptionsResult.count || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar dados administrativos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados administrativos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin, form]);

  const updateSettings = async (values: AdminSettingsFormValues) => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      if (values.openai_api_key && !values.openai_api_key.startsWith("***")) {
        const { error } = await supabase
          .from("system_settings")
          .upsert({
            key: "openai_api_key",
            value: values.openai_api_key,
          });

        if (error) throw error;

        toast({
          title: "Configurações atualizadas",
          description: "A chave da OpenAI foi configurada com sucesso.",
        });

        // Mascarar a chave no formulário
        form.setValue("openai_api_key", "***" + values.openai_api_key.slice(-4));
      }
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Carregando...</div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  if (!isAdmin) {
    return (
      <AuthGuard>
        <Layout>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Acesso negado. Esta página é restrita a administradores.
            </AlertDescription>
          </Alert>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Painel Administrativo</h2>
            <Badge variant="default">Administrador</Badge>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSales}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Descrições Geradas</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGeneratedDescriptions}</div>
              </CardContent>
            </Card>
          </div>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Gerencie as configurações globais da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(updateSettings)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="openai_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Chave da API OpenAI
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="sk-..." 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Esta chave será usada para todas as gerações de conteúdo com IA na aplicação.
                          Os usuários não precisam inserir suas próprias chaves.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> As configurações aqui definidas afetam todos os usuários da aplicação. 
              Certifique-se de que as chaves de API estão corretas e válidas.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminPage;
