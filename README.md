# 🏢 Sistema de Gestão TI

Um sistema completo de gestão empresarial desenvolvido em React.js com Supabase, oferecendo controle de usuários, folgas, férias, ativos, estoque e muito mais.

## ✨ Características

### 🎨 **Design Padronizado**
- **Design System Consistente**: Paleta de cores unificada com variáveis CSS
- **Tipografia Inter**: Fonte moderna e legível em todos os dispositivos
- **Temas Claro/Escuro**: Suporte completo a ambos os temas
- **Responsividade Total**: Otimizado para desktop, tablet e mobile
- **Acessibilidade**: Suporte a `prefers-reduced-motion` e `prefers-contrast`

### 🔧 **Funcionalidades Principais**

#### 👥 **Gestão de Usuários**
- Cadastro e edição de usuários
- Controle de perfis (Coordenador/Usuário)
- Sistema de autenticação seguro
- Recuperação de senha

#### 📅 **Gestão de Folgas e Férias**
- Solicitação de folgas com aprovação
- Gestão de férias com controle de períodos
- Sistema de aprovação hierárquico
- Histórico completo de solicitações

#### 💻 **Controle de Ativos**
- Cadastro de equipamentos e dispositivos
- Categorização por tipos
- Controle de status (Em estoque, Em uso, Em manutenção)
- Histórico de movimentações

#### 📦 **Controle de Estoque**
- Sistema de racks organizados por níveis
- Gestão de endereços e posições
- Controle de itens por endereço
- Busca avançada em todo o estoque

#### 🔄 **Troca de Turnos**
- Solicitação de troca de turnos
- Sistema de aprovação
- Histórico de trocas

#### 📋 **Pendências**
- Controle de pendências do sistema
- Acompanhamento de status
- Notificações

### 🛠 **Tecnologias Utilizadas**

- **Frontend**: React.js 18+ com Hooks
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Roteamento**: React Router DOM
- **Estilização**: CSS Modules com variáveis CSS
- **Ícones**: React Icons
- **Notificações**: React Hot Toast
- **Estado**: Context API + useState/useEffect

## 🚀 **Instalação e Configuração**

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd projeto-ti
```

### 2. Instale as dependências
```bash
cd frontend
npm install
```

### 3. Configure o Supabase
1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente no arquivo `.env`:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 📁 **Estrutura do Projeto**

```
projeto-ti/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Componentes de autenticação
│   │   │   ├── layout/        # Layout principal
│   │   │   └── ui/           # Componentes de interface
│   │   ├── context/          # Contextos React (Auth, Theme)
│   │   ├── lib/              # Configurações (Supabase)
│   │   ├── pages/            # Páginas do sistema
│   │   ├── assets/           # Recursos estáticos
│   │   ├── index.css         # CSS global padronizado
│   │   ├── App.jsx           # Componente principal
│   │   └── main.jsx          # Ponto de entrada
│   ├── public/               # Arquivos públicos
│   └── package.json
├── supabase/                 # Configurações do Supabase
│   ├── functions/           # Edge Functions
│   └── config.toml
└── README.md
```

## 🎨 **Design System**

### Cores
```css
/* Tema Claro */
--primary-color: #E67E22
--primary-color-dark: #D35400
--bg-color: #f8fafc
--bg-secondary-color: #ffffff
--primary-text-color: #0f172a
--secondary-text-color: #64748b

/* Tema Escuro */
--bg-color: #0f172a
--bg-secondary-color: #1e293b
--primary-text-color: #f8fafc
--secondary-text-color: #cbd5e1
```

### Tipografia
- **Fonte**: Inter (300, 400, 500, 600, 700, 800)
- **Tamanhos**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Line-height**: tight (1.25), normal (1.5), relaxed (1.75)

### Espaçamentos
- **xs**: 4px, **sm**: 8px, **md**: 16px
- **lg**: 24px, **xl**: 32px, **2xl**: 48px

### Border Radius
- **sm**: 6px, **md**: 8px, **lg**: 12px, **xl**: 16px

## 📱 **Responsividade**

O sistema é totalmente responsivo com breakpoints:
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px  
- **Mobile**: < 768px
- **Mobile Pequeno**: < 480px

## 🔐 **Autenticação e Segurança**

- **Supabase Auth**: Sistema de autenticação robusto
- **Row Level Security (RLS)**: Controle de acesso por usuário
- **JWT Tokens**: Autenticação baseada em tokens
- **Proteção de Rotas**: Componentes de rota protegida

## 📊 **Funcionalidades por Perfil**

### 👨‍💼 **Coordenador**
- Gestão completa de usuários
- Aprovação de solicitações
- Visualização de estatísticas gerais
- Controle de ativos e estoque
- Relatórios e histórico

### 👤 **Usuário**
- Solicitação de folgas e férias
- Visualização de suas pendências
- Troca de turnos
- Acompanhamento de histórico pessoal

## 🚀 **Deploy**

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Netlify
1. Conecte o repositório
2. Configure build command: `npm run build`
3. Configure publish directory: `dist`

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 **Suporte**

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ pela equipe de TI**
