import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaSearch, FaDownload, FaBox, FaUser, FaCalendar, FaWrench } from 'react-icons/fa';
import './Historico.css';
import './ControleDeAtivos.css';

function Historico() {
  const [baixas, setBaixas] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('baixas'); // 'baixas' | 'manutencao'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar baixas da tabela baixas
      let baixasData = [];
      try {
        const { data: baixasRes, error: baixasError } = await supabase
          .from('baixas')
          .select('*')
          .order('created_at', { ascending: false });

        if (baixasError) {
          console.error('Erro ao buscar baixas:', baixasError);
        } else {
          baixasData = baixasRes || [];
        }
      } catch (error) {
        console.error('Erro na consulta de baixas:', error);
      }

      // Buscar manutenções da tabela manutencao
      let manutData = [];
      try {
        const { data: manutencaoRes, error: manutencaoError } = await supabase
          .from('manutencao')
          .select('*')
          .order('maintenance_date', { ascending: false });

        if (manutencaoError) {
          console.error('Erro ao buscar manutenções:', manutencaoError);
        } else {
          manutData = manutencaoRes || [];
        }
      } catch (error) {
        console.error('Erro na consulta de manutenção:', error);
      }

      // Enriquecer baixas com dados do ativo e usuário que fez a baixa
      const assetIdsBaixas = Array.from(new Set(baixasData.map(b => b.asset_id).filter(Boolean)));
      const userIdsBaixas = Array.from(new Set(baixasData.map(b => b.created_by).filter(Boolean)));
      
      let assetsInfoBaixas = { data: [], error: null };
      let usersInfoBaixas = { data: [], error: null };

      if (assetIdsBaixas.length > 0) {
        try {
          assetsInfoBaixas = await supabase
            .from('ativos')
            .select('id, serial_number, category')
            .in('id', assetIdsBaixas);
          
          if (assetsInfoBaixas.error) {
            console.error('Erro ao buscar informações dos ativos para baixas:', assetsInfoBaixas.error);
          }
        } catch (error) {
          console.error('Erro na consulta de informações dos ativos para baixas:', error);
        }
      }

      if (userIdsBaixas.length > 0) {
        try {
          usersInfoBaixas = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIdsBaixas);
          
          if (usersInfoBaixas.error) {
            console.error('Erro ao buscar informações dos usuários para baixas:', usersInfoBaixas.error);
          }
        } catch (error) {
          console.error('Erro na consulta de informações dos usuários para baixas:', error);
        }
      }

      // Enriquecer manutenções com dados do ativo e usuário que mandou para manutenção
      const assetIdsManut = Array.from(new Set(manutData.map(m => m.asset_id).filter(Boolean)));
      const userIdsManut = Array.from(new Set(manutData.map(m => m.performed_by).filter(Boolean)));
      
      let assetsInfoManut = { data: [], error: null };
      let usersInfoManut = { data: [], error: null };

      if (assetIdsManut.length > 0) {
        try {
          assetsInfoManut = await supabase
            .from('ativos')
            .select('id, serial_number, category')
            .in('id', assetIdsManut);
          
          if (assetsInfoManut.error) {
            console.error('Erro ao buscar informações dos ativos para manutenções:', assetsInfoManut.error);
          }
        } catch (error) {
          console.error('Erro na consulta de informações dos ativos para manutenções:', error);
        }
      }

      if (userIdsManut.length > 0) {
        try {
          usersInfoManut = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIdsManut);
          
          if (usersInfoManut.error) {
            console.error('Erro ao buscar informações dos usuários para manutenções:', usersInfoManut.error);
          }
        } catch (error) {
          console.error('Erro na consulta de informações dos usuários para manutenções:', error);
        }
      }

      const assetMapBaixas = {};
      (assetsInfoBaixas.data || []).forEach(a => { assetMapBaixas[a.id] = a; });

      const userMapBaixas = {};
      (usersInfoBaixas.data || []).forEach(u => { userMapBaixas[u.id] = u; });

      const assetMapManut = {};
      (assetsInfoManut.data || []).forEach(a => { assetMapManut[a.id] = a; });

      const userMapManut = {};
      (usersInfoManut.data || []).forEach(u => { userMapManut[u.id] = u; });

      const baixasEnriquecidas = baixasData.map(b => ({
        ...b,
        asset: assetMapBaixas[b.asset_id] || null,
        user: userMapBaixas[b.created_by] || null
      }));

      const manutencoesEnriquecidas = manutData.map(m => ({
        ...m,
        asset: assetMapManut[m.asset_id] || null,
        user: userMapManut[m.performed_by] || null
      }));

      setBaixas(baixasEnriquecidas || []);
      setManutencoes(manutencoesEnriquecidas || []);
    } catch (error) {
      console.error('Erro ao carregar dados do histórico:', error);
      setBaixas([]);
      setManutencoes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  const filteredBaixas = useMemo(() => {
    return baixas.filter(baixa => {
      const s = (searchTerm || '').toLowerCase();
      const matchesSearch = !s || 
        (baixa.asset?.serial_number && baixa.asset.serial_number.toLowerCase().includes(s)) ||
        (baixa.asset?.category && baixa.asset.category.toLowerCase().includes(s)) ||
        (baixa.reason && baixa.reason.toLowerCase().includes(s));
      return matchesSearch;
    });
  }, [baixas, searchTerm]);

  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(manut => {
      const cat = manut.asset?.category || '';
      const serial = manut.asset?.serial_number || '';
      const desc = manut.description || '';
      const s = (searchTerm || '').toLowerCase();
      const matchesSearch = !s || serial.toLowerCase().includes(s) || cat.toLowerCase().includes(s) || desc.toLowerCase().includes(s);
      return matchesSearch;
    });
  }, [manutencoes, searchTerm]);

  const getStatusIcon = (statusOrType) => {
    if (statusOrType === 'manutencao') return <FaWrench />;
    switch (statusOrType) {
      case 'Descartado':
      case 'Baixa':
        return <FaBox />;
      default:
        return <FaBox />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Descartado':
      case 'Baixa':
        return 'status-descartado';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    if (activeTab === 'baixas') {
      const csvContent = [
        ['Número de Série', 'Categoria', 'Data da Baixa', 'Motivo da Baixa', 'Responsável', 'Registrado em'],
        ...filteredBaixas.map(baixa => [
          baixa.asset?.serial_number || '-',
          baixa.asset?.category || '-',
          formatDate(baixa.decommission_date || baixa.created_at),
          (baixa.reason || '-').replace(/\n/g, ' '),
          baixa.user?.full_name || 'Usuário não identificado',
          formatDateTime(baixa.created_at)
        ])
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'historico_baixas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const csvContent = [
        ['Número de Série', 'Categoria', 'Data de Envio', 'Descrição', 'Responsável'],
        ...filteredManutencoes.map(manut => [
          manut.asset?.serial_number || '-',
          manut.asset?.category || '-',
          formatDate(manut.maintenance_date),
          (manut.description || '-').replace(/\n/g, ' '),
          manut.user?.full_name || 'Usuário não identificado'
        ])
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'historico_manutencao.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="historico-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historico-container">
      {/* Header da página */}
      <div className="assets-page-header">
        <h1>📋 Histórico</h1>
        <div className="search-and-actions">
          <input 
            type="search" 
            placeholder={activeTab === 'baixas' ? 'Buscar por número de série, categoria ou motivo...' : 'Buscar por número de série, categoria ou descrição...'} 
            className="search-input" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <button className="form-button" onClick={handleExport}>
            <FaDownload style={{ marginRight: '8px' }} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Abas de tipo */}
      <div className="historico-tabs">
        <button
          onClick={() => setActiveTab('baixas')}
          className={`historico-tab ${activeTab === 'baixas' ? 'active' : ''}`}
        >
          Baixas ({filteredBaixas.length})
        </button>
        <button
          onClick={() => setActiveTab('manutencao')}
          className={`historico-tab ${activeTab === 'manutencao' ? 'active' : ''}`}
        >
          Manutenção ({filteredManutencoes.length})
        </button>
      </div>

      {/* Tabela de resultados */}
      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            {activeTab === 'baixas' ? (
              <tr>
                <th>Ativo</th>
                <th>Categoria</th>
                <th>Data da Baixa</th>
                <th>Motivo</th>
                <th>Responsável</th>
                <th>Registrado em</th>
              </tr>
            ) : (
              <tr>
                <th>Ativo</th>
                <th>Categoria</th>
                <th>Data de Envio</th>
                <th>Descrição</th>
                <th>Responsável</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTab === 'baixas' ? (
              filteredBaixas.length > 0 ? (
                filteredBaixas.map(baixa => (
                  <tr key={baixa.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--danger-color)' }}>📦</span>
                        <span style={{ fontWeight: '500' }}>
                          {baixa.asset?.serial_number || 'Sem número de série'}
                        </span>
                      </div>
                    </td>
                    <td>{baixa.asset?.category || 'Sem categoria'}</td>
                    <td>
                      <span style={{ 
                        color: 'var(--danger-color)', 
                        fontWeight: '500',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {formatDate(baixa.decommission_date || baixa.created_at)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                      {baixa.reason || 'Sem motivo especificado'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaUser style={{ color: 'var(--secondary-text-color)', fontSize: '12px' }} />
                        <span>{baixa.user?.full_name || 'Usuário não identificado'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--secondary-text-color)', fontSize: 'var(--font-size-sm)' }}>
                      {formatDateTime(baixa.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {searchTerm 
                      ? 'Nenhuma baixa encontrada com os filtros aplicados.'
                      : 'Nenhuma baixa encontrada.'
                    }
                  </td>
                </tr>
              )
            ) : (
              filteredManutencoes.length > 0 ? (
                filteredManutencoes.map(manut => (
                  <tr key={manut.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--warning-color)' }}>🔧</span>
                        <span style={{ fontWeight: '500' }}>
                          {manut.asset?.serial_number || 'Sem número de série'}
                        </span>
                      </div>
                    </td>
                    <td>{manut.asset?.category || 'Sem categoria'}</td>
                    <td>
                      <span style={{ 
                        color: 'var(--warning-color)', 
                        fontWeight: '500',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {formatDate(manut.maintenance_date)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                      {manut.description || 'Sem descrição'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaUser style={{ color: 'var(--secondary-text-color)', fontSize: '12px' }} />
                        <span>{manut.user?.full_name || 'Usuário não identificado'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchTerm 
                      ? 'Nenhum registro encontrado com os filtros aplicados.'
                      : 'Nenhum registro de manutenção encontrado.'
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Historico;