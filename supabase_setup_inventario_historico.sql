-- ===== CONFIGURAÇÃO DO BANCO DE DADOS PARA INVENTÁRIO E HISTÓRICO =====

-- 1. Tabela de Categorias de Ativos (se não existir)
CREATE TABLE IF NOT EXISTS categorias_ativos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    icon VARCHAR(50) DEFAULT 'box',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Ativos (se não existir)
CREATE TABLE IF NOT EXISTS ativos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria_id INTEGER REFERENCES categorias_ativos(id),
    status VARCHAR(50) DEFAULT 'estoque' CHECK (status IN ('estoque', 'uso', 'manutencao', 'baixa')),
    data_baixa DATE,
    motivo_baixa TEXT,
    responsavel_id UUID REFERENCES auth.users(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Histórico de Movimentações
CREATE TABLE IF NOT EXISTS historico_movimentacoes (
    id SERIAL PRIMARY KEY,
    ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
    tipo_movimentacao VARCHAR(50) NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'transferencia', 'baixa')),
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50),
    responsavel_id UUID REFERENCES auth.users(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_ativos_categoria ON ativos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ativos_status ON ativos(status);
CREATE INDEX IF NOT EXISTS idx_ativos_data_baixa ON ativos(data_baixa);
CREATE INDEX IF NOT EXISTS idx_historico_ativo ON historico_movimentacoes(ativo_id);
CREATE INDEX IF NOT EXISTS idx_historico_tipo ON historico_movimentacoes(tipo_movimentacao);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_movimentacoes(created_at);

-- 5. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_ativos_updated_at 
    BEFORE UPDATE ON categorias_ativos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ativos_updated_at 
    BEFORE UPDATE ON ativos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Função para obter estatísticas do inventário por categoria
CREATE OR REPLACE FUNCTION get_inventory_stats_by_category()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_object_agg(
        categoria_id::text,
        json_build_object(
            'estoque', COALESCE(estoque_count, 0),
            'uso', COALESCE(uso_count, 0),
            'manutencao', COALESCE(manutencao_count, 0)
        )
    ) INTO result
    FROM (
        SELECT 
            categoria_id,
            COUNT(CASE WHEN status = 'estoque' THEN 1 END) as estoque_count,
            COUNT(CASE WHEN status = 'uso' THEN 1 END) as uso_count,
            COUNT(CASE WHEN status = 'manutencao' THEN 1 END) as manutencao_count
        FROM ativos
        WHERE categoria_id IS NOT NULL
        GROUP BY categoria_id
    ) stats;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- 7. Função para registrar movimentação automática
CREATE OR REPLACE FUNCTION registrar_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou, registrar a movimentação
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO historico_movimentacoes (
            ativo_id,
            tipo_movimentacao,
            status_anterior,
            status_novo,
            responsavel_id,
            observacoes
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.status = 'baixa' THEN 'baixa'
                WHEN OLD.status = 'estoque' AND NEW.status IN ('uso', 'manutencao') THEN 'saida'
                WHEN OLD.status IN ('uso', 'manutencao') AND NEW.status = 'estoque' THEN 'entrada'
                ELSE 'transferencia'
            END,
            OLD.status,
            NEW.status,
            NEW.responsavel_id,
            NEW.observacoes
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para registrar movimentações automaticamente
CREATE TRIGGER trigger_registrar_movimentacao
    AFTER UPDATE ON ativos
    FOR EACH ROW EXECUTE FUNCTION registrar_movimentacao();

-- 9. RLS (Row Level Security) Policies
ALTER TABLE categorias_ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_ativos (todos podem ler, apenas coordenadores podem modificar)
CREATE POLICY "Categorias visíveis para todos" ON categorias_ativos
    FOR SELECT USING (true);

CREATE POLICY "Apenas coordenadores podem modificar categorias" ON categorias_ativos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'coordenador'
        )
    );

-- Políticas para ativos
CREATE POLICY "Ativos visíveis para todos" ON ativos
    FOR SELECT USING (true);

CREATE POLICY "Apenas coordenadores podem modificar ativos" ON ativos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'coordenador'
        )
    );

-- Políticas para histórico_movimentacoes
CREATE POLICY "Histórico visível para todos" ON historico_movimentacoes
    FOR SELECT USING (true);

CREATE POLICY "Apenas coordenadores podem inserir histórico" ON historico_movimentacoes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'coordenador'
        )
    );

-- 10. Dados de exemplo (opcional)
INSERT INTO categorias_ativos (nome, descricao, icon) VALUES
    ('Computadores', 'Desktops e workstations', 'desktop'),
    ('Notebooks', 'Laptops e notebooks', 'laptop'),
    ('Tablets', 'Tablets e iPads', 'tablet'),
    ('Smartphones', 'Celulares e smartphones', 'mobile'),
    ('Servidores', 'Servidores e racks', 'server'),
    ('Redes', 'Equipamentos de rede', 'network'),
    ('Impressoras', 'Impressoras e scanners', 'print'),
    ('Periféricos', 'Mouses, teclados, etc.', 'keyboard')
ON CONFLICT (nome) DO NOTHING;

-- 11. Função para obter estatísticas gerais do inventário
CREATE OR REPLACE FUNCTION get_inventory_overview()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_estoque', COALESCE(estoque_count, 0),
        'total_uso', COALESCE(uso_count, 0),
        'total_manutencao', COALESCE(manutencao_count, 0),
        'total_baixa', COALESCE(baixa_count, 0),
        'total_geral', COALESCE(total_count, 0)
    ) INTO result
    FROM (
        SELECT 
            COUNT(CASE WHEN status = 'estoque' THEN 1 END) as estoque_count,
            COUNT(CASE WHEN status = 'uso' THEN 1 END) as uso_count,
            COUNT(CASE WHEN status = 'manutencao' THEN 1 END) as manutencao_count,
            COUNT(CASE WHEN status = 'baixa' THEN 1 END) as baixa_count,
            COUNT(*) as total_count
        FROM ativos
    ) stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Função para obter histórico de baixas
CREATE OR REPLACE FUNCTION get_baixas_history()
RETURNS TABLE (
    id INTEGER,
    nome VARCHAR(255),
    categoria_nome VARCHAR(100),
    status VARCHAR(50),
    data_baixa DATE,
    motivo_baixa TEXT,
    responsavel_nome TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.nome,
        ca.nome as categoria_nome,
        a.status,
        a.data_baixa,
        a.motivo_baixa,
        u.raw_user_meta_data->>'full_name' as responsavel_nome
    FROM ativos a
    LEFT JOIN categorias_ativos ca ON a.categoria_id = ca.id
    LEFT JOIN auth.users u ON a.responsavel_id = u.id
    WHERE a.status = 'baixa'
    ORDER BY a.data_baixa DESC;
END;
$$ LANGUAGE plpgsql;

-- 13. Comentários para documentação
COMMENT ON TABLE categorias_ativos IS 'Categorias de ativos do sistema';
COMMENT ON TABLE ativos IS 'Ativos do sistema com controle de status';
COMMENT ON TABLE historico_movimentacoes IS 'Histórico de movimentações dos ativos';
COMMENT ON FUNCTION get_inventory_stats_by_category() IS 'Retorna estatísticas do inventário por categoria';
COMMENT ON FUNCTION get_inventory_overview() IS 'Retorna visão geral do inventário';
COMMENT ON FUNCTION get_baixas_history() IS 'Retorna histórico de baixas de ativos';
