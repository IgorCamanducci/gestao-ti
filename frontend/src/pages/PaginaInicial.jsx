import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  FaUsers, FaCalendarAlt, FaExchangeAlt, FaTasks, FaBoxOpen, 
  FaDesktop, FaWarehouse, FaWrench, FaChartLine, FaBell,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaUserTie
} from 'react-icons/fa';
import { FaKey } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './PaginaInicial.css';

// --- Componente para os Cards de Estatística ---
const StatCard = React.memo(({ title, value, icon, type = 'primary', subtitle = null, link = null }) => (
  <div className={`stat-card ${type} ${link ? 'clickable' : ''}`}>
    {link ? (
      <Link to={link} className="stat-card-link">
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
          <div className="stat-value">{value || 0}</div>
          <div className="stat-label">{title}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
      </Link>
    ) : (
      <>
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
          <div className="stat-value">{value || 0}</div>
          <div className="stat-label">{title}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
      </>
    )}
  </div>
));

// --- Componente para Notificações Rápidas ---
const QuickNotification = React.memo(({ title, message, type = 'info', link = null }) => (
  <div className={`quick-notification ${type}`}>
    <div className="notification-icon">
      {type === 'success' && <FaCheckCircle />}
      {type === 'warning' && <FaExclamationTriangle />}
      {type === 'info' && <FaBell />}
    </div>
    <div className="notification-content">
      <h4>{title}</h4>
      <p>{message}</p>
      {link && <Link to={link.to} className="notification-link">{link.text}</Link>}
    </div>
  </div>
));

// --- Componente Principal do Dashboard ---
function PaginaInicial() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    assetsInMaintenance: 0,
    criticalTasks: 0,
    overdueTasks: 0,
    lowStockItems: 0
  });

  // Efeito para a saudação e o relógio
  const updateDateTime = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
    setCurrentDateTime(new Date());
  }, []);

  useEffect(() => {
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, [updateDateTime]);

  // Efeito para buscar os dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        
        // Buscar estatísticas básicas
        const [assetsRes, tasksRes, usersRes] = await Promise.all([
          supabase.from('ativos').select('status, category'),
          supabase.from('tasks').select('status, priority, due_date'),
          supabase.from('profiles').select('id, role')
        ]);

        // Calcular estatísticas
        const assets = assetsRes.data || [];
        const tasks = tasksRes.data || [];
        const users = usersRes.data || [];

        const calculatedStats = {
          total_assets: assets.length,
          assets_in_use: assets.filter(a => a.status === 'Em uso').length,
          assets_in_maintenance: assets.filter(a => a.status === 'Em manutenção').length,
          assets_in_stock: assets.filter(a => a.status === 'Em estoque').length,
          total_tasks: tasks.length,
          pending_tasks: tasks.filter(t => t.status === 'Aberta').length,
          critical_tasks: tasks.filter(t => t.priority === 'Crítica').length,
          total_users: users.length,
          coordinators: users.filter(u => u.role === 'coordenador').length
        };

        // Calcular saúde do sistema
        const today = new Date();
        const overdueTasks = tasks.filter(t => 
          t.due_date && new Date(t.due_date) < today && t.status !== 'Concluída'
        ).length;

        setSystemHealth({
          assetsInMaintenance: calculatedStats.assets_in_maintenance,
          criticalTasks: calculatedStats.critical_tasks,
          overdueTasks: overdueTasks,
          lowStockItems: calculatedStats.assets_in_stock < 5 ? calculatedStats.assets_in_stock : 0
        });

        setStats(calculatedStats);

        // Buscar atividades recentes
        const recentData = await Promise.all([
          supabase.from('ativos').select('serial_number, category, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('tasks').select('title, status, updated_at').order('updated_at', { ascending: false }).limit(3)
        ]);

        const recentAssets = recentData[0].data || [];
        const recentTasks = recentData[1].data || [];

        const activity = [
          ...recentAssets.map(asset => ({
            type: 'asset',
            title: `Ativo ${asset.serial_number}`,
            description: `Categoria: ${asset.category}`,
            date: asset.updated_at
          })),
          ...recentTasks.map(task => ({
            type: 'task',
            title: task.title,
            description: `Status: ${task.status}`,
            date: task.updated_at
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        setRecentActivity(activity);

      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Definir valores padrão em caso de erro
        setStats({
          total_assets: 0,
          assets_in_use: 0,
          assets_in_maintenance: 0,
          assets_in_stock: 0,
          total_tasks: 0,
          pending_tasks: 0,
          critical_tasks: 0,
          total_users: 0,
          coordinators: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [profile]);

  const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }), []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <div className="header-content">
          <h1>{greeting}, {profile?.full_name || 'Usuário'}! 🏠</h1>
          <p style={{ color: 'var(--secondary-text-color)', margin: 0 }}>
            {dateTimeFormatter.format(currentDateTime)}
          </p>
        </div>
        <div className="search-and-actions">
          <div className="system-health">
            {systemHealth.criticalTasks > 0 && (
              <div className="health-alert critical">
                <FaExclamationTriangle />
                <span>{systemHealth.criticalTasks} tarefas críticas</span>
              </div>
            )}
            {systemHealth.overdueTasks > 0 && (
              <div className="health-alert warning">
                <FaClock />
                <span>{systemHealth.overdueTasks} tarefas vencidas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Renderização condicional baseada no papel do usuário */}
      {profile?.role === 'coordenador' ? (
        <>
          {/* Estatísticas Gerais */}
          <div className="dashboard-stats">
            <StatCard 
              title="Total de Ativos" 
              value={stats?.total_assets} 
              icon={<FaDesktop />} 
              type="primary" 
              link="/ativos"
            />
            <StatCard 
              title="Em Uso" 
              value={stats?.assets_in_use} 
              icon={<FaDesktop />} 
              type="success" 
              link="/ativos"
            />
            <StatCard 
              title="Em Manutenção" 
              value={stats?.assets_in_maintenance} 
              icon={<FaWrench />} 
              type="warning" 
              link="/manutencao"
            />
            <StatCard 
              title="Em Estoque" 
              value={stats?.assets_in_stock} 
              icon={<FaWarehouse />} 
              type="info" 
              link="/estoque"
            />
          </div>

          <div className="dashboard-stats">
            <StatCard 
              title="Total de Usuários" 
              value={stats?.total_users} 
              icon={<FaUsers />} 
              type="primary" 
              link="/usuarios"
            />
            <StatCard 
              title="Coordenadores" 
              value={stats?.coordinators} 
              icon={<FaUserTie />} 
              type="info" 
              link="/usuarios"
            />
            <StatCard 
              title="Pendências Abertas" 
              value={stats?.pending_tasks} 
              icon={<FaTasks />} 
              type="warning" 
              link="/pendencias"
            />
            <StatCard 
              title="Tarefas Críticas" 
              value={stats?.critical_tasks} 
              icon={<FaExclamationTriangle />} 
              type="danger" 
              link="/pendencias"
            />
          </div>

          {/* Seções do Dashboard */}
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
                <Link to="/senhas" className="quick-action-btn">
                  <FaKey /> Senhas
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

          {/* Atividades Recentes */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">🕒</span>
                Atividades Recentes
              </h3>
            </div>
            <div className="recent-activities">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'asset' ? <FaDesktop /> : <FaTasks />}
                    </div>
                    <div className="activity-content">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <span className="activity-time">
                        {new Date(activity.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-activities">Nenhuma atividade recente.</p>
              )}
            </div>
          </div>

          {/* Notificações Rápidas */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">🔔</span>
                Notificações
              </h3>
            </div>
            <div className="quick-notifications">
              {systemHealth.criticalTasks > 0 && (
                <QuickNotification
                  title="Tarefas Críticas"
                  message={`${systemHealth.criticalTasks} tarefas críticas precisam de atenção imediata.`}
                  type="warning"
                  link={{ to: '/pendencias', text: 'Ver Pendências' }}
                />
              )}
              {systemHealth.overdueTasks > 0 && (
                <QuickNotification
                  title="Tarefas Vencidas"
                  message={`${systemHealth.overdueTasks} tarefas estão vencidas.`}
                  type="warning"
                  link={{ to: '/pendencias', text: 'Ver Pendências' }}
                />
              )}
              {systemHealth.assetsInMaintenance > 0 && (
                <QuickNotification
                  title="Ativos em Manutenção"
                  message={`${systemHealth.assetsInMaintenance} ativos estão em manutenção.`}
                  type="info"
                  link={{ to: '/manutencao', text: 'Ver Manutenção' }}
                />
              )}
              {systemHealth.lowStockItems > 0 && (
                <QuickNotification
                  title="Estoque Baixo"
                  message="Alguns itens estão com estoque baixo."
                  type="info"
                  link={{ to: '/estoque', text: 'Ver Estoque' }}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Dashboard para usuários comuns */}
          <div className="dashboard-stats">
            <StatCard 
              title="Minhas Pendências" 
              value={stats?.pending_tasks} 
              icon={<FaTasks />} 
              type="warning" 
              link="/pendencias"
            />
            <StatCard 
              title="Tarefas Críticas" 
              value={stats?.critical_tasks} 
              icon={<FaExclamationTriangle />} 
              type="danger" 
              link="/pendencias"
            />
            <StatCard 
              title="Ativos Disponíveis" 
              value={stats?.assets_in_stock} 
              icon={<FaWarehouse />} 
              type="success" 
              link="/estoque"
            />
            <StatCard 
              title="Em Manutenção" 
              value={stats?.assets_in_maintenance} 
              icon={<FaWrench />} 
              type="info" 
              link="/manutencao"
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
                <p>Faça suas solicitações de folga diretamente pelo sistema e gerencie as senhas de equipamentos.</p>
              </div>
              <div className="quick-actions">
                <Link to="/folgas" className="quick-action-btn">
                  <FaCalendarAlt /> Solicitar Folga
                </Link>
                <Link to="/senhas" className="quick-action-btn">
                  <FaKey /> Senhas
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

          {/* Atividades Recentes para usuários comuns */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">🕒</span>
                Atividades Recentes
              </h3>
            </div>
            <div className="recent-activities">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'asset' ? <FaDesktop /> : <FaTasks />}
                    </div>
                    <div className="activity-content">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <span className="activity-time">
                        {new Date(activity.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-activities">Nenhuma atividade recente.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PaginaInicial;