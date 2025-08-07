-- ===== SETUP DO SISTEMA DE ESTOQUE =====

-- Tabela de Racks
CREATE TABLE IF NOT EXISTS estoque_racks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    niveis INTEGER NOT NULL DEFAULT 1,
    enderecos_por_nivel INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Endereços (Posições)
CREATE TABLE IF NOT EXISTS estoque_enderecos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rack_id UUID NOT NULL REFERENCES estoque_racks(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    nivel INTEGER NOT NULL,
    endereco VARCHAR(10) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rack_id, name)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_estoque_enderecos_rack_id ON estoque_enderecos(rack_id);
CREATE INDEX IF NOT EXISTS idx_estoque_enderecos_name ON estoque_enderecos(name);
CREATE INDEX IF NOT EXISTS idx_estoque_racks_name ON estoque_racks(name);

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps
CREATE TRIGGER update_estoque_racks_updated_at 
    BEFORE UPDATE ON estoque_racks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estoque_enderecos_updated_at 
    BEFORE UPDATE ON estoque_enderecos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE estoque_racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_enderecos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver racks" ON estoque_racks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir racks" ON estoque_racks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar racks" ON estoque_racks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar racks" ON estoque_racks
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver endereços" ON estoque_enderecos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir endereços" ON estoque_enderecos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar endereços" ON estoque_enderecos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar endereços" ON estoque_enderecos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Função para gerar endereços automaticamente
CREATE OR REPLACE FUNCTION generate_rack_addresses(
    p_rack_id UUID,
    p_niveis INTEGER,
    p_enderecos_por_nivel INTEGER
)
RETURNS VOID AS $$
DECLARE
    nivel_counter INTEGER;
    endereco_counter INTEGER;
    endereco_char CHAR(1);
    endereco_name VARCHAR(50);
BEGIN
    -- Limpar endereços existentes do rack
    DELETE FROM estoque_enderecos WHERE rack_id = p_rack_id;
    
    -- Gerar novos endereços
    FOR nivel_counter IN 1..p_niveis LOOP
        FOR endereco_counter IN 0..(p_enderecos_por_nivel - 1) LOOP
            endereco_char := CHR(65 + endereco_counter); -- A, B, C, etc.
            endereco_name := nivel_counter || endereco_char;
            
            INSERT INTO estoque_enderecos (rack_id, name, nivel, endereco, items, observation)
            VALUES (p_rack_id, endereco_name, nivel_counter, endereco_char, '[]'::jsonb, '');
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar nível ao rack
CREATE OR REPLACE FUNCTION add_rack_level(p_rack_id UUID)
RETURNS VOID AS $$
DECLARE
    rack_record RECORD;
    endereco_counter INTEGER;
    endereco_char CHAR(1);
    endereco_name VARCHAR(50);
    novo_nivel INTEGER;
BEGIN
    -- Buscar informações do rack
    SELECT * INTO rack_record FROM estoque_racks WHERE id = p_rack_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rack não encontrado';
    END IF;
    
    novo_nivel := rack_record.niveis + 1;
    
    -- Adicionar novos endereços para o novo nível
    FOR endereco_counter IN 0..(rack_record.enderecos_por_nivel - 1) LOOP
        endereco_char := CHR(65 + endereco_counter);
        endereco_name := novo_nivel || endereco_char;
        
        INSERT INTO estoque_enderecos (rack_id, name, nivel, endereco, items, observation)
        VALUES (p_rack_id, endereco_name, novo_nivel, endereco_char, '[]'::jsonb, '');
    END LOOP;
    
    -- Atualizar número de níveis no rack
    UPDATE estoque_racks SET niveis = novo_nivel WHERE id = p_rack_id;
END;
$$ LANGUAGE plpgsql;

-- Função para remover último nível do rack
CREATE OR REPLACE FUNCTION remove_rack_level(p_rack_id UUID)
RETURNS VOID AS $$
DECLARE
    rack_record RECORD;
    max_nivel INTEGER;
BEGIN
    -- Buscar informações do rack
    SELECT * INTO rack_record FROM estoque_racks WHERE id = p_rack_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rack não encontrado';
    END IF;
    
    IF rack_record.niveis <= 1 THEN
        RAISE EXCEPTION 'Não é possível remover o último nível do rack';
    END IF;
    
    -- Encontrar o nível máximo
    SELECT MAX(nivel) INTO max_nivel FROM estoque_enderecos WHERE rack_id = p_rack_id;
    
    -- Remover endereços do último nível
    DELETE FROM estoque_enderecos WHERE rack_id = p_rack_id AND nivel = max_nivel;
    
    -- Atualizar número de níveis no rack
    UPDATE estoque_racks SET niveis = max_nivel - 1 WHERE id = p_rack_id;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar endereço por nível
CREATE OR REPLACE FUNCTION add_rack_address(p_rack_id UUID)
RETURNS VOID AS $$
DECLARE
    rack_record RECORD;
    nivel_counter INTEGER;
    novo_endereco_num INTEGER;
    endereco_char CHAR(1);
    endereco_name VARCHAR(50);
BEGIN
    -- Buscar informações do rack
    SELECT * INTO rack_record FROM estoque_racks WHERE id = p_rack_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rack não encontrado';
    END IF;
    
    novo_endereco_num := rack_record.enderecos_por_nivel;
    endereco_char := CHR(65 + novo_endereco_num);
    
    -- Adicionar novo endereço em todos os níveis
    FOR nivel_counter IN 1..rack_record.niveis LOOP
        endereco_name := nivel_counter || endereco_char;
        
        INSERT INTO estoque_enderecos (rack_id, name, nivel, endereco, items, observation)
        VALUES (p_rack_id, endereco_name, nivel_counter, endereco_char, '[]'::jsonb, '');
    END LOOP;
    
    -- Atualizar número de endereços por nível
    UPDATE estoque_racks SET enderecos_por_nivel = novo_endereco_num + 1 WHERE id = p_rack_id;
END;
$$ LANGUAGE plpgsql;

-- Função para remover último endereço de todos os níveis
CREATE OR REPLACE FUNCTION remove_rack_address(p_rack_id UUID)
RETURNS VOID AS $$
DECLARE
    rack_record RECORD;
    max_endereco CHAR(1);
BEGIN
    -- Buscar informações do rack
    SELECT * INTO rack_record FROM estoque_racks WHERE id = p_rack_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rack não encontrado';
    END IF;
    
    IF rack_record.enderecos_por_nivel <= 1 THEN
        RAISE EXCEPTION 'Não é possível remover o último endereço do rack';
    END IF;
    
    -- Encontrar o endereço máximo
    SELECT MAX(endereco) INTO max_endereco FROM estoque_enderecos WHERE rack_id = p_rack_id;
    
    -- Remover endereços do último endereço em todos os níveis
    DELETE FROM estoque_enderecos WHERE rack_id = p_rack_id AND endereco = max_endereco;
    
    -- Atualizar número de endereços por nível
    UPDATE estoque_racks SET enderecos_por_nivel = rack_record.enderecos_por_nivel - 1 WHERE id = p_rack_id;
END;
$$ LANGUAGE plpgsql;
