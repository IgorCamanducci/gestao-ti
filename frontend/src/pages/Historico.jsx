import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaSearch, FaFilter, FaDownload, FaEye, FaTrash, FaEdit, FaBox, FaDesktop, FaTools } from 'react-icons/fa';
import './Historico.css';

function Historico() {
  const [ativos, setAtivos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_ativos')
        .select('*')
        .order('nome');

      if (categoriasError) throw categoriasError;

      // Buscar ativos com baixa (status = 'baixa')
      const { data: ativosData, error: ativosError } = await supabase
        .from('ativos')
        .select(`
          *,
          categorias_ativos (
            id,
            nome
          )
        `)
        .eq('status', 'baixa')
        .order('data_baixa', { ascending: false });

      if (ativosError) throw ativosError;

      setCategorias(categoriasData || []);
      setAtivos(ativosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do histórico:', error);
      // Se não conseguir buscar dados reais, mostrar estado vazio
      setCategorias([]);
      setAtivos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAtivos = ativos.filter(ativo => {
    const matchesSearch = ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ativo.categorias_ativos?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || ativo.categoria_id === parseInt(selectedCategory);
    const matchesStatus = !selectedStatus || ativo.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'baixa':
        return <FaTrash />;
      default:
        return <FaBox />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'baixa':
        return 'baixa';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Categoria', 'Status', 'Data de Baixa', 'Motivo da Baixa'],
      ...filteredAtivos.map(ativo => [
        ativo.nome,
        ativo.categorias_ativos?.nome || '-',
        ativo.status,
        formatDate(ativo.data_baixa),
        ativo.motivo_baixa || '-'
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
      <div className="historico-header">
        <div className="header-content">
          <h1 className="historico-title">📋 Histórico de Ativos</h1>
          <p className="historico-subtitle">
            Visualize todos os ativos que foram dados baixa no sistema
          </p>
        </div>
        <div className="header-actions">
          <button className="export-button" onClick={handleExport}>
            <FaDownload />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Categoria:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os status</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="results-section">
        <div className="results-header">
          <h3 className="results-title">
            Resultados ({filteredAtivos.length} itens)
          </h3>
        </div>

        {filteredAtivos.length > 0 ? (
          <div className="table-container">
            <table className="historico-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Data de Baixa</th>
                  <th>Motivo da Baixa</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtivos.map(ativo => (
                  <tr key={ativo.id} className="table-row">
                    <td className="asset-name">
                      <div className="asset-info">
                        <span className="asset-icon">
                          {getStatusIcon(ativo.status)}
                        </span>
                        <span>{ativo.nome}</span>
                      </div>
                    </td>
                    <td className="asset-category">
                      {ativo.categorias_ativos?.nome || '-'}
                    </td>
                    <td className="asset-status">
                      <span className={`status-badge ${getStatusColor(ativo.status)}`}>
                        {ativo.status === 'baixa' ? 'Baixa' : ativo.status}
                      </span>
                    </td>
                    <td className="asset-date">
                      {formatDate(ativo.data_baixa)}
                    </td>
                    <td className="asset-reason">
                      {ativo.motivo_baixa || '-'}
                    </td>
                    <td className="asset-actions">
                      <button className="action-button view" title="Visualizar detalhes">
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaBox />
            </div>
            <h3>Nenhum item encontrado</h3>
            <p>
              {searchTerm || selectedCategory || selectedStatus
                ? 'Tente ajustar os filtros de busca.'
                : 'Não há itens com baixa registrados no sistema.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Historico;