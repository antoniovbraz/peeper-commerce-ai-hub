
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/lib/types";
import { User } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const userSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const SettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
    }
  });

  // Buscar dados do perfil
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

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Configurações</h2>
          </div>

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

          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure suas integrações com marketplaces e outros serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Para gerenciar suas integrações com Shopee, Mercado Livre e outros serviços,
                acesse a página de <strong>Integrações</strong> no menu lateral.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                A chave da OpenAI para geração de conteúdo é gerenciada pelo administrador do sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default SettingsPage;
