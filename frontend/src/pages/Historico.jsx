import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaSearch, FaDownload, FaBox } from 'react-icons/fa';
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
        ativo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Etiqueta', 'Categoria', 'Status', 'Data de Baixa', 'Motivo da Baixa'],
      ...filteredAtivos.map(ativo => [
        ativo.name,
        ativo.asset_tag || '-',
        ativo.category || '-',
        ativo.status,
        formatDate(ativo.decommission_date),
        ativo.decommission_reason || '-'
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
            placeholder="Buscar por nome ou etiqueta..." 
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
        {categorias.map(category => (
          <button 
            key={category.id} 
            onClick={() => setActiveTab(category.name)} 
            className={activeTab === category.name ? 'active' : ''}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Tabela de resultados */}
      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Etiqueta</th>
              <th>Status</th>
              <th>Data de Baixa</th>
              <th>Motivo da Baixa</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length > 0 && activeTab ? (
              filteredAtivos.length > 0 ? (
                filteredAtivos.map(ativo => (
                  <tr key={ativo.id}>
                    <td className="asset-name">
                      <div className="asset-info">
                        <span className="asset-icon">
                          {getStatusIcon(ativo.status)}
                        </span>
                        <span>{ativo.name}</span>
                      </div>
                    </td>
                    <td>{ativo.asset_tag || '-'}</td>
                    <td className={getStatusClass(ativo.status)}>
                      <span className="status-badge descartado">
                        {ativo.status === 'Descartado' ? 'Baixa' : ativo.status}
                      </span>
                    </td>
                    <td>{formatDate(ativo.decommission_date)}</td>
                    <td>{ativo.decommission_reason || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Nenhum ativo com baixa encontrado para esta categoria.
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={5} className="empty-state">
                  <span>
                    Nenhuma categoria de ativo foi criada. Vá para a{' '}
                    <a href="/configuracoes/categorias-ativos">página de gerenciamento</a> para começar.
                  </span>
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