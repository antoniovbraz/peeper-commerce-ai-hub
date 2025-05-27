
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const IntegrationGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Como funciona a integração?</CardTitle>
        <CardDescription>
          Entenda o processo de conexão com os marketplaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-medium">Autorização</h4>
            <p className="text-sm text-gray-600">Clique em conectar e autorize o acesso seguro à sua conta</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h4 className="font-medium">Sincronização</h4>
            <p className="text-sm text-gray-600">Seus produtos e dados são sincronizados automaticamente</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h4 className="font-medium">Automação</h4>
            <p className="text-sm text-gray-600">Gerencie tudo de forma centralizada no hub</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
