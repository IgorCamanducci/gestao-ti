import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ControleDeAtivos.css';

function AtivosEmManutencao() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssetsInMaintenance = async () => {
    try {
      setLoading(true);
      
      // Primeiro buscar os ativos em manutenção
      const { data: assetsData, error: assetsError } = await supabase
        .from('ativos')
        .select('*')
        .eq('status', 'Em manutenção')
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      // Depois buscar os dados de manutenção para cada ativo
      const processedAssets = await Promise.all(
        (assetsData || []).map(async (asset) => {
          try {
            const { data: maintenanceData, error: maintenanceError } = await supabase
              .from('manutencao')
              .select('maintenance_date, description, performed_by')
              .eq('asset_id', asset.id)
              .order('maintenance_date', { ascending: false })
              .limit(1);

            if (maintenanceError) {
              console.error('Erro ao buscar dados de manutenção:', maintenanceError);
              return {
                ...asset,
                maintenance_date: asset.updated_at,
                maintenance_description: 'Sem descrição',
                maintenance_performed_by: 'Sistema'
              };
            }

            const latestMaintenance = maintenanceData?.[0];
            
            return {
              ...asset,
              maintenance_date: latestMaintenance?.maintenance_date || asset.updated_at,
              maintenance_description: latestMaintenance?.description || 'Sem descrição',
              maintenance_performed_by: latestMaintenance?.performed_by || 'Sistema'
            };
          } catch (error) {
            console.error('Erro ao processar ativo:', asset.id, error);
            return {
              ...asset,
              maintenance_date: asset.updated_at,
              maintenance_description: 'Sem descrição',
              maintenance_performed_by: 'Sistema'
            };
          }
        })
      );
      
      setAssets(processedAssets);
    } catch (error) {
      console.error('Erro ao carregar ativos em manutenção:', error);
      toast.error('Erro ao carregar ativos em manutenção: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToStock = async (assetId) => {
    try {
      const toastId = toast.loading('Retornando ativo ao estoque...');
      
      const { error } = await supabase
        .from('ativos')
        .update({ status: 'Em estoque' })
        .eq('id', assetId);

      if (error) throw error;
      
      toast.success('Ativo retornado ao estoque!', { id: toastId });
      fetchAssetsInMaintenance();
    } catch (error) {
      toast.error('Erro ao retornar ativo: ' + error.message);
    }
  };

  const handleDecommission = async (assetId) => {
    try {
      const toastId = toast.loading('Dando baixa no ativo...');
      
      // Atualizar status para descartado diretamente
      const { error } = await supabase
        .from('ativos')
        .update({ 
          status: 'Descartado',
          decommission_date: new Date().toISOString().split('T')[0],
          decommission_reason: 'Baixa após manutenção',
          performed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', assetId);

      if (error) throw error;
      
      toast.success('Ativo dado baixa com sucesso!', { id: toastId });
      fetchAssetsInMaintenance();
    } catch (error) {
      toast.error('Erro ao dar baixa: ' + error.message);
    }
  };

  useEffect(() => {
    fetchAssetsInMaintenance();
  }, []);

  if (loading) return <div className="loading-state">Carregando ativos em manutenção...</div>;

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>🔧 Ativos em Manutenção</h1>
        <div className="search-and-actions">
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/ativos" className="form-button" style={{ background: 'var(--secondary-text-color)' }}>
              <FaArrowLeft style={{ marginRight: '8px' }} />
              Voltar
            </Link>
          </div>
        </div>
      </div>

      <div className="asset-table-container">
        {assets.length > 0 ? (
          <table className="asset-table">
            <thead>
              <tr>
                <th>Número de Série</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Data de Envio</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id}>
                  <td>{asset.serial_number || '---'}</td>
                  <td>{asset.category || '---'}</td>
                  <td className="status-em-manutencao">Em manutenção</td>
                  <td>{new Date(asset.maintenance_date).toLocaleDateString('pt-BR')}</td>
                  <td>{asset.maintenance_description}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                      <button 
                        className="form-button" 
                        style={{ 
                          background: 'var(--success-color)', 
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                        onClick={() => handleReturnToStock(asset.id)}
                        title="Retornar ao estoque"
                      >
                        <FaCheck size={12} />
                      </button>
                      <button 
                        className="form-button" 
                        style={{ 
                          background: 'var(--error-color)', 
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                        onClick={() => handleDecommission(asset.id)}
                        title="Dar baixa"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <span>Nenhum ativo em manutenção no momento.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AtivosEmManutencao;
