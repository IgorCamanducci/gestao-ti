import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaCalendarAlt, FaExchangeAlt, FaTasks, FaBoxOpen, FaDesktop, FaWarehouse } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './PaginaInicial.css';

// --- Componente para os Cards de Estatística ---
const StatCard = ({ title, value, icon, type = 'primary' }) => (
  <div className={`stat-card ${type}`}>
    <div className="stat-value">{value || 0}</div>
    <div className="stat-label">{title}</div>
    <div className="stat-description">
      {icon} {title.toLowerCase()}
    </div>
  </div>
);

// --- Componente Principal do Dashboard ---
function PaginaInicial() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Efeito para a saudação e o relógio
  useEffect(() => {
    const updateDateTime = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Bom dia');
      else if (hour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');
      setCurrentDateTime(new Date());
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  // Efeito para buscar os dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        const functionName = profile.role === 'coordenador' ? 'get_dashboard_stats' : 'get_athlete_dashboard_data';
        const { data, error } = await supabase.rpc(functionName);
        if (error) throw error;
        setStats(data[0]);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Definir valores padrão em caso de erro
        setStats({
          total_users: 0,
          pending_folgas: 0,
          pending_ferias: 0,
          pending_trocas: 0,
          pending_pendencias: 0,
          my_pending_folgas: 0,
          my_pending_ferias: 0,
          my_pending_trocas: 0,
          my_pending_pendencias: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [profile]);

  const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{greeting}, {profile?.full_name || 'Usuário'}!</h1>
        <p className="dashboard-subtitle">{dateTimeFormatter.format(currentDateTime)}</p>
      </div>

      {/* Renderização condicional baseada no papel do usuário */}
      {profile?.role === 'coordenador' ? (
        <>
          <div className="dashboard-stats">
            <StatCard 
              title="Total de Usuários" 
              value={stats?.total_users} 
              icon={<FaUsers />} 
              type="primary" 
            />
            <StatCard 
              title="Folgas Pendentes" 
              value={stats?.pending_folgas} 
              icon={<FaCalendarAlt />} 
              type="warning" 
            />
            <StatCard 
              title="Férias Pendentes" 
              value={stats?.pending_ferias} 
              icon={<FaCalendarAlt />} 
              type="info" 
            />
            <StatCard 
              title="Trocas Pendentes" 
              value={stats?.pending_trocas} 
              icon={<FaExchangeAlt />} 
              type="warning" 
            />
            <StatCard 
              title="Pendências Abertas" 
              value={stats?.pending_pendencias} 
              icon={<FaTasks />} 
              type="info" 
            />
          </div>

          <div className="dashboard-sections">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">
                  <span className="section-icon">📊</span>
                  Visão Geral do Sistema
                </h3>
              </div>
              <div className="section-content">
                <p>Bem-vindo ao painel de controle do sistema de gestão. Aqui você pode acompanhar todas as atividades e pendências dos usuários.</p>
                <p>Use o menu lateral para acessar as diferentes funcionalidades disponíveis.</p>
              </div>
              <div className="quick-actions">
                <Link to="/usuarios" className="quick-action-btn">
                  <FaUsers /> Gerenciar Usuários
                </Link>
                <Link to="/folgas" className="quick-action-btn">
                  <FaCalendarAlt /> Gestão de Folgas
                </Link>
                <Link to="/ferias" className="quick-action-btn">
                  <FaCalendarAlt /> Gestão de Férias
                </Link>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">
                  <span className="section-icon">⚙️</span>
                  Controles do Sistema
                </h3>
              </div>
              <div className="section-content">
                <p>Acesse os controles de ativos e estoque para gerenciar equipamentos e materiais da empresa.</p>
                <p>Mantenha o inventário atualizado e controle o uso dos recursos.</p>
              </div>
              <div className="quick-actions">
                <Link to="/ativos" className="quick-action-btn">
                  <FaDesktop /> Controle de Ativos
                </Link>
                <Link to="/estoque" className="quick-action-btn">
                  <FaWarehouse /> Controle de Estoque
                </Link>
                <Link to="/inventario" className="quick-action-btn">
                  <FaBoxOpen /> Inventário
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="dashboard-stats">
            <StatCard 
              title="Minhas Folgas Pendentes" 
              value={stats?.my_pending_folgas} 
              icon={<FaCalendarAlt />} 
              type="warning" 
            />
            <StatCard 
              title="Minhas Férias Pendentes" 
              value={stats?.my_pending_ferias} 
              icon={<FaCalendarAlt />} 
              type="info" 
            />
            <StatCard 
              title="Minhas Trocas Pendentes" 
              value={stats?.my_pending_trocas} 
              icon={<FaExchangeAlt />} 
              type="warning" 
            />
            <StatCard 
              title="Minhas Pendências" 
              value={stats?.my_pending_pendencias} 
              icon={<FaTasks />} 
              type="info" 
            />
          </div>

          <div className="dashboard-sections">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">
                  <span className="section-icon">📅</span>
                  Solicitações Rápidas
                </h3>
              </div>
              <div className="section-content">
                <p>Faça suas solicitações de folga e férias diretamente pelo sistema. Acompanhe o status das suas solicitações pendentes.</p>
              </div>
              <div className="quick-actions">
                <Link to="/folgas" className="quick-action-btn">
                  <FaCalendarAlt /> Solicitar Folga
                </Link>
                <Link to="/ferias" className="quick-action-btn">
                  <FaCalendarAlt /> Solicitar Férias
                </Link>
                <Link to="/turno" className="quick-action-btn">
                  <FaExchangeAlt /> Trocar Turno
                </Link>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">
                  <span className="section-icon">📋</span>
                  Acompanhamento
                </h3>
              </div>
              <div className="section-content">
                <p>Visualize o histórico das suas solicitações e acompanhe suas pendências em aberto.</p>
              </div>
              <div className="quick-actions">
                <Link to="/historico" className="quick-action-btn">
                  📊 Ver Histórico
                </Link>
                <Link to="/pendencias" className="quick-action-btn">
                  <FaTasks /> Minhas Pendências
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PaginaInicial;