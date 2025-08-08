-- ===== CONFIGURAÇÃO DO BANCO DE DADOS - TROCA DE TURNO =====

-- Tabela principal de trocas de turno
CREATE TABLE IF NOT EXISTS shift_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    shift_date DATE NOT NULL,
    shift_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado', 'Concluído', 'Arquivado')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de trocas de turno
CREATE TABLE IF NOT EXISTS shift_change_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_change_id UUID REFERENCES shift_changes(id) ON DELETE CASCADE,
    event_description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_shift_changes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER shift_changes_updated_at
    BEFORE UPDATE ON shift_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_shift_changes_updated_at();

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION log_shift_change_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO shift_change_history (shift_change_id, event_description, created_by)
        VALUES (NEW.id, 'Troca de turno criada', NEW.created_by);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO shift_change_history (shift_change_id, event_description, created_by)
        VALUES (NEW.id, 'Troca de turno atualizada', NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar histórico
CREATE TRIGGER shift_changes_history_log
    AFTER INSERT OR UPDATE ON shift_changes
    FOR EACH ROW
    EXECUTE FUNCTION log_shift_change_event();

-- Políticas de segurança (RLS)
ALTER TABLE shift_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_change_history ENABLE ROW LEVEL SECURITY;

-- Políticas para shift_changes
CREATE POLICY "Usuários autenticados podem ver todas as trocas de turno" ON shift_changes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar trocas de turno" ON shift_changes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar trocas de turno" ON shift_changes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para shift_change_history
CREATE POLICY "Usuários autenticados podem ver histórico" ON shift_change_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sistema pode inserir histórico" ON shift_change_history
    FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_shift_changes_status ON shift_changes(status);
CREATE INDEX IF NOT EXISTS idx_shift_changes_date ON shift_changes(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_changes_created_at ON shift_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_shift_change_history_shift_id ON shift_change_history(shift_change_id);

-- Comentários para documentação
COMMENT ON TABLE shift_changes IS 'Tabela para armazenar trocas de turno';
COMMENT ON TABLE shift_change_history IS 'Histórico de alterações nas trocas de turno';
COMMENT ON COLUMN shift_changes.description IS 'Descrição da troca de turno';
COMMENT ON COLUMN shift_changes.shift_date IS 'Data do turno';
COMMENT ON COLUMN shift_changes.shift_time IS 'Horário do turno';
COMMENT ON COLUMN shift_changes.status IS 'Status da troca: Pendente, Aprovado, Rejeitado, Concluído, Arquivado';
