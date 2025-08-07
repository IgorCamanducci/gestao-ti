# Configuração do Banco de Dados - Sistema de Estoque

## Passo 1: Executar o SQL no Supabase

1. Acesse o painel do Supabase do seu projeto
2. Vá para **SQL Editor**
3. Copie e cole todo o conteúdo do arquivo `supabase_setup_estoque.sql`
4. Clique em **Run** para executar

## Passo 2: Verificar as Tabelas Criadas

Após executar o SQL, você deve ter as seguintes tabelas:

### Tabela: `estoque_racks`
- `id` (UUID, Primary Key)
- `name` (VARCHAR) - Nome do rack
- `niveis` (INTEGER) - Número de níveis
- `enderecos_por_nivel` (INTEGER) - Endereços por nível
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Tabela: `estoque_enderecos`
- `id` (UUID, Primary Key)
- `rack_id` (UUID, Foreign Key) - Referência ao rack
- `name` (VARCHAR) - Nome do endereço (ex: "1A", "2B")
- `nivel` (INTEGER) - Número do nível
- `endereco` (VARCHAR) - Letra do endereço (A, B, C...)
- `items` (JSONB) - Array de itens no endereço
- `observation` (TEXT) - Observações
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Passo 3: Funções SQL Criadas

O sistema criou as seguintes funções para gerenciar racks:

1. **`generate_rack_addresses`** - Gera endereços automaticamente ao criar rack
2. **`add_rack_level`** - Adiciona um novo nível ao rack
3. **`remove_rack_level`** - Remove o último nível do rack
4. **`add_rack_address`** - Adiciona um novo endereço em todos os níveis
5. **`remove_rack_address`** - Remove o último endereço de todos os níveis

## Passo 4: Políticas de Segurança

O sistema configurou automaticamente:
- Row Level Security (RLS) habilitado
- Políticas para usuários autenticados
- Permissões de CRUD para todas as operações

## Passo 5: Testar o Sistema

1. Execute o projeto React: `npm run dev`
2. Acesse a página de Controle de Estoque
3. Clique em "Configurações" para criar seu primeiro rack
4. Teste as funcionalidades de adicionar/remover níveis e endereços

## Funcionalidades Disponíveis

### ✅ Implementadas:
- Criar racks com níveis e endereços configuráveis
- Adicionar/remover níveis de rack
- Adicionar/remover endereços por nível
- Editar itens em cada endereço
- Excluir endereços individuais
- Busca em todos os racks ou rack específico
- Interface responsiva

### 🔧 Como Usar:

1. **Criar Rack**: Clique em "Configurações" → "Adicionar Novo Rack"
2. **Adicionar Nível**: Configurações → "Adicionar Nível"
3. **Adicionar Endereço**: Configurações → "Adicionar Endereço"
4. **Editar Itens**: Clique no ícone de edição em qualquer endereço
5. **Excluir Endereço**: No modal de edição, clique em "Excluir Endereço"

## Estrutura de Dados

### Exemplo de Rack:
```
Rack 01 (3 níveis × 4 endereços)
├── 1A, 1B, 1C, 1D
├── 2A, 2B, 2C, 2D
└── 3A, 3B, 3C, 3D
```

### Exemplo de Item:
```json
{
  "id": 1234567890,
  "name": "Mouse Logitech",
  "quantity": 5
}
```

## Solução de Problemas

### Erro: "Could not find a relationship"
- Execute o SQL completo no Supabase
- Verifique se as tabelas foram criadas corretamente
- Confirme que as políticas RLS estão ativas

### Erro: "Function not found"
- Verifique se todas as funções SQL foram criadas
- Execute novamente o arquivo SQL se necessário

### Erro: "Permission denied"
- Verifique se o usuário está autenticado
- Confirme que as políticas RLS estão configuradas corretamente
