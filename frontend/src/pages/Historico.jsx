import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaSearch, FaDownload, FaBox, FaUser, FaCalendar } from 'react-icons/fa';
import './Historico.css';
import './ControleDeAtivos.css';

function Historico() {
  const [ativos, setAtivos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('');

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

      // Buscar ativos com baixa (status = 'Descartado')
      const { data: ativosData, error: ativosError } = await supabase
        .from('ativos')
        .select('*')
        .eq('status', 'Descartado')
        .order('decommission_date', { ascending: false });

      if (ativosError) throw ativosError;

      setCategorias(categoriasData || []);
      setAtivos(ativosData || []);
      
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

  // Filtrar ativos por categoria ativa e termo de busca
  const filteredAtivos = useMemo(() => {
    return ativos.filter(ativo => {
      const matchesCategory = !activeTab || ativo.category === activeTab;
      const matchesSearch = !searchTerm || 
        (ativo.serial_number && ativo.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ativo.category && ativo.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ativo.decommission_reason && ativo.decommission_reason.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [ativos, activeTab, searchTerm]);

  const getStatusIcon = (status) => {
    switch (status) {
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
    const csvContent = [
      ['Número de Série', 'Categoria', 'Status', 'Data de Baixa', 'Motivo da Baixa', 'Quem Deu Baixa', 'Data de Criação'],
      ...filteredAtivos.map(ativo => [
        ativo.serial_number || '-',
        ativo.category || '-',
        ativo.status,
        formatDate(ativo.decommission_date),
        ativo.decommission_reason || '-',
        ativo.profiles?.full_name || 'Sistema',
        formatDate(ativo.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'historico_ativos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h1>📋 Histórico de Ativos</h1>
        <div className="search-and-actions">
          <input 
            type="search" 
            placeholder="Buscar por número de série, categoria ou motivo..." 
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

      {/* Abas de categorias */}
      <div className="asset-tabs">
        <button 
          onClick={() => setActiveTab('')} 
          className={activeTab === '' ? 'active' : ''}
        >
          Todas ({filteredAtivos.length})
        </button>
        {categorias.map(category => (
          <button 
            key={category.id} 
            onClick={() => setActiveTab(category.name)} 
            className={activeTab === category.name ? 'active' : ''}
          >
            {category.name} ({filteredAtivos.filter(ativo => ativo.category === category.name).length})
          </button>
        ))}
      </div>

      {/* Tabela de resultados */}
      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Número de Série</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Data de Baixa</th>
              <th>Motivo da Baixa</th>
              <th>Quem Deu Baixa</th>
              <th>Data de Criação</th>
            </tr>
          </thead>
          <tbody>
            {filteredAtivos.length > 0 ? (
              filteredAtivos.map(ativo => (
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
                      <span>{ativo.performed_by ? 'Usuário' : 'Sistema'}</span>
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Historico;