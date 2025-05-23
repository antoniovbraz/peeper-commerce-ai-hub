
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const authFormSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailConfirmationMessage, setEmailConfirmationMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Clear error messages when switching between login and signup
  useEffect(() => {
    setAuthError(null);
    setEmailConfirmationMessage(null);
  }, [isLogin]);

  const onSubmit = async (values: AuthFormValues) => {
    try {
      setLoading(true);
      setAuthError(null);
      setEmailConfirmationMessage(null);
      
      if (isLogin) {
        await signIn(values.email, values.password);
      } else {
        await signUp(values.email, values.password);
        setEmailConfirmationMessage(
          "Cadastro realizado! Verifique seu email para confirmação. Se não receber o email, verifique sua pasta de spam ou contate o administrador."
        );
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.message === "Email not confirmed") {
        setAuthError(
          "Email não confirmado. Por favor, verifique sua caixa de entrada (incluindo spam) para o link de confirmação ou contate o administrador para desativar a confirmação de email."
        );
      } else {
        setAuthError(error.message || "Erro na autenticação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário já está logado, redireciona para o dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Social Peepers AI Hub</CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Faça login na sua conta" : "Crie uma nova conta"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Erro de autenticação</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {emailConfirmationMessage && (
            <Alert className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Email de confirmação enviado</AlertTitle>
              <AlertDescription>{emailConfirmationMessage}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {isLogin ? "Entrar" : "Cadastrar"}
              </Button>
            </form>
          </Form>
          
          <Alert className="mt-4 bg-blue-50 border border-blue-100">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Dica para desenvolvedores</AlertTitle>
            <AlertDescription>
              Se estiver tendo problemas com "Email not confirmed", o administrador pode desativar a confirmação de email nas configurações do Supabase.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
