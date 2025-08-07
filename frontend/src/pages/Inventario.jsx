import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaDesktop, FaLaptop, FaTablet, FaMobile, FaServer, FaNetworkWired, FaPrint, FaKeyboard, FaMouse, FaHeadphones, FaBox, FaTools } from 'react-icons/fa';
import './Inventario.css';

function Inventario() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      // Buscar categorias reais do banco
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias_ativos')
        .select('*')
        .order('nome');

      if (categoriesError) throw categoriesError;

      // Buscar estatísticas por categoria
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_inventory_stats_by_category');

      if (statsError) {
        console.warn('Erro ao buscar estatísticas, usando dados vazios:', statsError);
        // Se a função RPC não existir, criar estatísticas vazias
        const emptyStats = {};
        if (categoriesData) {
          categoriesData.forEach(category => {
            emptyStats[category.id] = { estoque: 0, uso: 0, manutencao: 0 };
          });
        }
        setStats(emptyStats);
      } else {
        setStats(statsData || {});
      }

      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do inventário:', error);
      // Se não conseguir buscar dados reais, mostrar estado vazio
      setCategories([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      desktop: <FaDesktop />,
      laptop: <FaLaptop />,
      tablet: <FaTablet />,
      mobile: <FaMobile />,
      server: <FaServer />,
      network: <FaNetworkWired />,
      print: <FaPrint />,
      keyboard: <FaKeyboard />,
      mouse: <FaMouse />,
      headphones: <FaHeadphones />,
      box: <FaBox />,
      tools: <FaTools />
    };
    return iconMap[iconName] || <FaBox />;
  };

  const getTotalByCategory = (categoryId) => {
    const categoryStats = stats[categoryId] || { estoque: 0, uso: 0, manutencao: 0 };
    return categoryStats.estoque + categoryStats.uso + categoryStats.manutencao;
  };

  const getTotalByStatus = (status) => {
    return Object.values(stats).reduce((total, categoryStats) => {
      return total + (categoryStats[status] || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="inventario-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando inventário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <h1 className="inventario-title">📊 Inventário Geral</h1>
        <p className="inventario-subtitle">
          Visão geral de todos os ativos organizados por categoria
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>Total de Itens</h3>
            <p className="stat-value">
              {Object.keys(stats).reduce((total, categoryId) => 
                total + getTotalByCategory(parseInt(categoryId)), 0
              )}
            </p>
          </div>
        </div>

        <div className="stat-card estoque">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>Em Estoque</h3>
            <p className="stat-value">{getTotalByStatus('estoque')}</p>
          </div>
        </div>

        <div className="stat-card uso">
          <div className="stat-icon">
            <FaDesktop />
          </div>
          <div className="stat-content">
            <h3>Em Uso</h3>
            <p className="stat-value">{getTotalByStatus('uso')}</p>
          </div>
        </div>

        <div className="stat-card manutencao">
          <div className="stat-icon">
            <FaTools />
          </div>
          <div className="stat-content">
            <h3>Em Manutenção</h3>
            <p className="stat-value">{getTotalByStatus('manutencao')}</p>
          </div>
        </div>
      </div>

      {/* Cards por Categoria */}
      <div className="categories-grid">
        {categories.map(category => {
          const categoryStats = stats[category.id] || { estoque: 0, uso: 0, manutencao: 0 };
          const total = getTotalByCategory(category.id);

          return (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <div className="category-icon">
                  {getCategoryIcon(category.icon)}
                </div>
                <div className="category-info">
                  <h3 className="category-name">{category.nome}</h3>
                  <p className="category-total">{total} itens</p>
                </div>
              </div>

              <div className="category-stats">
                <div className="stat-item estoque">
                  <span className="stat-label">Estoque</span>
                  <span className="stat-value">{categoryStats.estoque}</span>
                </div>
                <div className="stat-item uso">
                  <span className="stat-label">Em Uso</span>
                  <span className="stat-value">{categoryStats.uso}</span>
                </div>
                <div className="stat-item manutencao">
                  <span className="stat-label">Manutenção</span>
                  <span className="stat-value">{categoryStats.manutencao}</span>
                </div>
              </div>

              <div className="category-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-segment estoque" 
                    style={{ width: `${total > 0 ? (categoryStats.estoque / total) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="progress-segment uso" 
                    style={{ width: `${total > 0 ? (categoryStats.uso / total) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="progress-segment manutencao" 
                    style={{ width: `${total > 0 ? (categoryStats.manutencao / total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <FaBox />
          </div>
          <h3>Nenhuma categoria encontrada</h3>
          <p>Adicione categorias no controle de ativos para visualizar o inventário.</p>
        </div>
      )}
    </div>
  );
}

export default Inventario;