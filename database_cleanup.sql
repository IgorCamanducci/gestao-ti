-- =====================================================
-- SCRIPT DE LIMPEZA DO BANCO DE DADOS PARA PRODUÇÃO
-- =====================================================
-- Este script remove dados de teste mantendo usuários e estrutura
-- Execute com cuidado e sempre faça backup antes!

-- Desabilitar triggers temporariamente para evitar erros de FK
SET session_replication_role = replica;

-- =====================================================
-- 1. LIMPEZA DE DADOS DE ATIVOS E INVENTÁRIO
-- =====================================================

-- Remover baixas de ativos (histórico de baixas)
DELETE FROM baixas;

-- Remover histórico de manutenções
DELETE FROM manutencao;

-- Remover ativos (mantém apenas a estrutura de categorias)
DELETE FROM ativos;

-- =====================================================
-- 2. LIMPEZA DE TAREFAS E PENDÊNCIAS
-- =====================================================

-- Remover histórico de tarefas
DELETE FROM task_history;

-- Remover comentários de tarefas
DELETE FROM task_comments;

-- Remover visualizações de tarefas
DELETE FROM task_views;

-- Remover tarefas
DELETE FROM tasks;

-- =====================================================
-- 3. LIMPEZA DE FOLGAS E TURNOS
-- =====================================================

-- Remover histórico de troca de turno
DELETE FROM shift_change_history;

-- Remover visualizações de troca de turno
DELETE FROM shift_change_views;

-- Remover trocas de turno
DELETE FROM shift_changes;

-- Remover folgas
DELETE FROM folgas;

-- =====================================================
-- 4. LIMPEZA DE ESTOQUE
-- =====================================================

-- Remover endereços de estoque
DELETE FROM estoque_enderecos;

-- Remover racks de estoque
DELETE FROM estoque_racks;

-- =====================================================
-- 5. LIMPEZA DE ANOTAÇÕES E SENHAS
-- =====================================================

-- Remover anotações (notes)
DELETE FROM notes;

-- Remover senhas
DELETE FROM senhas;

-- =====================================================
-- 6. LIMPEZA DE AVATARS (OPCIONAL)
-- =====================================================
-- Descomente se quiser remover avatars também
-- DELETE FROM avatars;

-- =====================================================
-- 7. RESETAR SEQUENCES (se necessário)
-- =====================================================
-- Descomente e ajuste conforme suas sequences
-- ALTER SEQUENCE ativos_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
-- ALTER SEQUENCE baixas_id_seq RESTART WITH 1;
-- ALTER SEQUENCE manutencao_id_seq RESTART WITH 1;

-- =====================================================
-- 8. REABILITAR TRIGGERS
-- =====================================================
SET session_replication_role = DEFAULT;

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================
-- Verificar se as tabelas estão vazias (exceto usuários)
SELECT 
    'ativos' as tabela, COUNT(*) as registros FROM ativos
UNION ALL
SELECT 'baixas', COUNT(*) FROM baixas
UNION ALL
SELECT 'manutencao', COUNT(*) FROM manutencao
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'task_comments', COUNT(*) FROM task_comments
UNION ALL
SELECT 'folgas', COUNT(*) FROM folgas
UNION ALL
SELECT 'shift_changes', COUNT(*) FROM shift_changes
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'senhas', COUNT(*) FROM senhas
UNION ALL
SELECT 'estoque_racks', COUNT(*) FROM estoque_racks
UNION ALL
SELECT 'estoque_enderecos', COUNT(*) FROM estoque_enderecos;

-- Verificar usuários mantidos
SELECT 'profiles' as tabela, COUNT(*) as usuarios_mantidos FROM profiles;
SELECT 'asset_categories' as tabela, COUNT(*) as categorias_mantidas FROM asset_categories;
SELECT 'asset_category_fields' as tabela, COUNT(*) as campos_mantidos FROM asset_category_fields;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
