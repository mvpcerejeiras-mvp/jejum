
-- Adiciona a coluna member_id na tabela participants vinculando-a à tabela members
-- Isso é necessário para o novo fluxo de participação única e edição.

ALTER TABLE participants ADD COLUMN member_id UUID REFERENCES members(id);

-- Opcional: Indexar para busca mais rápida
CREATE INDEX IF NOT EXISTS idx_participants_member_id ON participants(member_id);
