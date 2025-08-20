import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaSearch, FaDownload, FaBox, FaUser, FaCalendar, FaWrench } from 'react-icons/fa';
import './Historico.css';
import './ControleDeAtivos.css';

function Historico() {
  const [ativos, setAtivos] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [typeTab, setTypeTab] = useState('baixas'); // 'baixas' | 'manutencao'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');

      if (categoriasError) throw categoriasError;

      // Baixas (ativos descartados)
      const [ativosRes, manutencaoRes] = await Promise.all([
        supabase
          .from('ativos')
          .select('*, profiles(full_name)')
          .eq('status', 'Descartado')
          .order('decommission_date', { ascending: false }),
        supabase
          .from('manutencao_ativos')
          .select('id, asset_id, maintenance_date, description, performed_by')
          .order('maintenance_date', { ascending: false })
      ]);

      if (ativosRes.error) throw ativosRes.error;
      if (manutencaoRes.error) throw manutencaoRes.error;

      const ativosData = ativosRes.data || [];
      const manutData = manutencaoRes.data || [];

      // Enriquecer manutenção com dados do ativo e do usuário
      const assetIds = Array.from(new Set(manutData.map(r => r.asset_id).filter(Boolean)));
      const userIds = Array.from(new Set(manutData
        .map(r => r.performed_by)
        .filter(v => typeof v === 'string' && v.length >= 20)
      ));

      const [assetsInfoRes, usersInfoRes] = await Promise.all([
        assetIds.length > 0
          ? supabase.from('ativos').select('id, serial_number, category').in('id', assetIds)
          : Promise.resolve({ data: [], error: null }),
        userIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', userIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      if (assetsInfoRes.error) throw assetsInfoRes.error;
      if (usersInfoRes.error) throw usersInfoRes.error;

      const assetMap = {};
      (assetsInfoRes.data || []).forEach(a => { assetMap[a.id] = a; });
      const userMap = {};
      (usersInfoRes.data || []).forEach(u => { userMap[u.id] = u.full_name; });

      const manutencoesEnriquecidas = manutData.map(r => ({
        ...r,
        asset: assetMap[r.asset_id] || null,
        performer_name: userMap[r.performed_by] || (r.performed_by ? 'Usuário' : 'Sistema')
      }));

      setCategorias(categoriasData || []);
      setAtivos(ativosData);
      setManutencoes(manutencoesEnriquecidas);
      
      // Definir primeira categoria como ativa
      if (categoriasData && categoriasData.length > 0) {
        setActiveTab(categoriasData[0].name);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do histórico:', error);
      setCategorias([]);
      setAtivos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  const filteredBaixas = useMemo(() => {
    return ativos.filter(ativo => {
      const matchesCategory = !activeTab || ativo.category === activeTab;
      const s = (searchTerm || '').toLowerCase();
      const matchesSearch = !s || 
        (ativo.serial_number && ativo.serial_number.toLowerCase().includes(s)) ||
        (ativo.category && ativo.category.toLowerCase().includes(s)) ||
        (ativo.decommission_reason && ativo.decommission_reason.toLowerCase().includes(s));
      return matchesCategory && matchesSearch;
    });
  }, [ativos, activeTab, searchTerm]);

  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(r => {
      const cat = r.asset?.category || '';
      const serial = r.asset?.serial_number || '';
      const desc = r.description || '';
      const matchesCategory = !activeTab || cat === activeTab;
      const s = (searchTerm || '').toLowerCase();
      const matchesSearch = !s || serial.toLowerCase().includes(s) || cat.toLowerCase().includes(s) || desc.toLowerCase().includes(s);
      return matchesCategory && matchesSearch;
    });
  }, [manutencoes, activeTab, searchTerm]);

  const getStatusIcon = (statusOrType) => {
    if (statusOrType === 'manutencao') return <FaWrench />;
    switch (statusOrType) {
      case 'Descartado':
        return <FaBox />;
      default:
        return <FaBox />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Descartado':
        return 'status-descartado';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleExport = () => {
    if (typeTab === 'baixas') {
      const csvContent = [
        ['Número de Série', 'Categoria', 'Status', 'Data de Baixa', 'Motivo da Baixa', 'Responsável', 'Data de Criação'],
        ...filteredBaixas.map(ativo => [
          ativo.serial_number || '-',
          ativo.category || '-',
          ativo.status,
          formatDate(ativo.decommission_date),
          (ativo.decommission_reason || '-').replace(/\n/g, ' '),
          ativo.profiles?.full_name || 'Sistema',
          formatDate(ativo.created_at)
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
        ['Número de Série', 'Categoria', 'Status', 'Data de Envio', 'Descrição', 'Responsável'],
        ...filteredManutencoes.map(r => [
          r.asset?.serial_number || '-',
          r.asset?.category || '-',
          'Em manutenção',
          formatDate(r.maintenance_date),
          (r.description || '-').replace(/\n/g, ' '),
          r.performer_name || 'Sistema'
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
            placeholder={typeTab === 'baixas' ? 'Buscar por número de série, categoria ou motivo...' : 'Buscar por número de série, categoria ou descrição...'} 
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
      <div className="asset-tabs" style={{ marginBottom: 'var(--spacing-sm)' }}>
        <button
          onClick={() => setTypeTab('baixas')}
          className={typeTab === 'baixas' ? 'active' : ''}
        >
          Baixas ({filteredBaixas.length})
        </button>
        <button
          onClick={() => setTypeTab('manutencao')}
          className={typeTab === 'manutencao' ? 'active' : ''}
        >
          Manutenção ({filteredManutencoes.length})
        </button>
      </div>

      {/* Abas de categorias */}
      <div className="asset-tabs">
        <button 
          onClick={() => setActiveTab('')} 
          className={activeTab === '' ? 'active' : ''}
        >
          Todas ({typeTab === 'baixas' ? filteredBaixas.length : filteredManutencoes.length})
        </button>
        {categorias.map(category => (
          <button 
            key={category.id} 
            onClick={() => setActiveTab(category.name)} 
            className={activeTab === category.name ? 'active' : ''}
          >
            {category.name} ({(typeTab === 'baixas' ? filteredBaixas : filteredManutencoes).filter(item => (typeTab === 'baixas' ? item.category : item.asset?.category) === category.name).length})
          </button>
        ))}
      </div>

      {/* Tabela de resultados */}
      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            {typeTab === 'baixas' ? (
              <tr>
                <th>Número de Série</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Data de Baixa</th>
                <th>Motivo da Baixa</th>
                <th>Responsável</th>
                <th>Data de Criação</th>
              </tr>
            ) : (
              <tr>
                <th>Número de Série</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Data de Envio</th>
                <th>Descrição</th>
                <th>Responsável</th>
              </tr>
            )}
          </thead>
          <tbody>
            {typeTab === 'baixas' ? (
              filteredBaixas.length > 0 ? (
                filteredBaixas.map(ativo => (
                  <tr key={ativo.id}>
                    <td className="asset-name">
                      <div className="asset-info">
                        <span className="asset-icon">
                          {getStatusIcon(ativo.status)}
                        </span>
                        <span className="asset-serial-number">
                          {ativo.serial_number || 'Sem número de série'}
                        </span>
                      </div>
                    </td>
                    <td className="asset-category">
                      {ativo.category || 'Sem categoria'}
                    </td>
                    <td className={getStatusClass(ativo.status)}>
                      <span className="status-badge descartado">
                        {ativo.status === 'Descartado' ? 'Baixa' : ativo.status}
                      </span>
                    </td>
                    <td className="asset-date">
                      <div className="date-info">
                        <FaCalendar className="date-icon" />
                        <span>{formatDate(ativo.decommission_date)}</span>
                      </div>
                    </td>
                    <td className="asset-reason">
                      {ativo.decommission_reason || 'Sem motivo especificado'}
                    </td>
                    <td className="asset-user">
                      <div className="user-info">
                        <FaUser className="user-icon" />
                        <span>{ativo.profiles?.full_name || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="asset-created">
                      <div className="date-info">
                        <FaCalendar className="date-icon" />
                        <span>{formatDate(ativo.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm || activeTab 
                      ? 'Nenhum ativo encontrado com os filtros aplicados.'
                      : 'Nenhum ativo com baixa encontrado.'
                    }
                  </td>
                </tr>
              )
            ) : (
              filteredManutencoes.length > 0 ? (
                filteredManutencoes.map(r => (
                  <tr key={r.id}>
                    <td className="asset-name">
                      <div className="asset-info">
                        <span className="asset-icon">
                          {getStatusIcon('manutencao')}
                        </span>
                        <span className="asset-serial-number">
                          {r.asset?.serial_number || '---'}
                        </span>
                      </div>
                    </td>
                    <td className="asset-category">{r.asset?.category || '---'}</td>
                    <td className="status-em-manutencao">
                      <span className="status-badge">Em manutenção</span>
                    </td>
                    <td className="asset-date">
                      <div className="date-info">
                        <FaCalendar className="date-icon" />
                        <span>{formatDate(r.maintenance_date)}</span>
                      </div>
                    </td>
                    <td className="asset-reason">{r.description || '-'}</td>
                    <td className="asset-user">
                      <div className="user-info">
                        <FaUser className="user-icon" />
                        <span>{r.performer_name || 'Sistema'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {searchTerm || activeTab 
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