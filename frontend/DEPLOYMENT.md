# Guia de Deploy - GTI Gestão de TI

## Configuração de Variáveis de Ambiente

Para que a aplicação funcione corretamente em produção, especialmente a funcionalidade de recuperação de senha, você precisa configurar as seguintes variáveis de ambiente:

### Variáveis Obrigatórias

```bash
# URL do site para redirecionamentos (ex: https://seu-dominio.com)
VITE_SITE_URL=https://seu-dominio.com
```

### Como Configurar

#### 1. Para Vercel/Netlify
Adicione as variáveis no painel de configuração do seu provedor de hospedagem.

#### 2. Para Docker
```dockerfile
ENV VITE_SITE_URL=https://seu-dominio.com
```

#### 3. Para servidor próprio
Crie um arquivo `.env.production` na pasta `frontend/`:
```bash
VITE_SITE_URL=https://seu-dominio.com
```

### Funcionalidades Corrigidas

✅ **Favicon**: Agora funciona corretamente em produção com múltiplos formatos
✅ **Recuperação de Senha**: Detecta automaticamente a URL do site em produção
✅ **Sidebar**: Informações não são mais cortadas, com scroll personalizado quando necessário
✅ **Responsividade**: Sidebar funciona corretamente em todos os tamanhos de tela

### Notas Importantes

- A aplicação detecta automaticamente se está rodando em localhost e ajusta as configurações
- O favicon agora tem fallbacks para diferentes navegadores
- A sidebar tem scroll personalizado e discreto quando necessário
- Todos os elementos têm alturas mínimas para evitar cortes
