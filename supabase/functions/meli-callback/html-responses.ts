
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createErrorPage = (title: string, message: string, details?: string) => `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
  <h1 style="color: #e74c3c;">❌ ${title}</h1>
  <p>${message}</p>
  ${details ? `<p><strong>Detalhes:</strong> ${details}</p>` : ''}
  <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
</body>
</html>
`;

export const createSuccessPage = (userId: number) => `
<!DOCTYPE html>
<html>
<head>
  <title>Conexão Bem-sucedida</title>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      text-align: center; 
      padding: 50px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
    }
    .container {
      background: white;
      color: #333;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      max-width: 500px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color: #27ae60; margin-bottom: 20px;">✅ Conexão Bem-sucedida!</h1>
    <p style="font-size: 18px; margin-bottom: 20px;">Sua conta do Mercado Livre Brasil foi conectada com sucesso usando OAuth2 + PKCE.</p>
    <p style="color: #666; margin-bottom: 10px;"><strong>ID do usuário ML:</strong> ${userId}</p>
    <p style="color: #666; margin-bottom: 30px;">Você pode fechar esta aba e retornar ao aplicativo.</p>
    <button onclick="window.close()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Fechar esta aba</button>
  </div>
  <script>
    // Tentar fechar automaticamente após 3 segundos
    setTimeout(() => {
      try {
        window.close();
      } catch(e) {
        console.log('Auto-close não suportado');
      }
    }, 3000);
  </script>
</body>
</html>
`;
