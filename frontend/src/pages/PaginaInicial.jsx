import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaCalendarAlt, FaExchangeAlt, FaTasks } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './PaginaInicial.css';

// --- Componente para os Cards de Estatística ---
const StatCard = ({ title, value, icon, iconClass }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
      <span className="stat-card-title">{title}</span>
    </div>
    <span className="stat-card-value">{value}</span>
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
        toast.error('Erro ao carregar dados do dashboard.');
        console.error(error);
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

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="greeting">{greeting}, {profile?.full_name || 'Usuário'}!</h1>
        <p className="date-time">{dateTimeFormatter.format(currentDateTime)}</p>
      </div>

      {/* Renderização condicional baseada no papel do usuário */}
      {profile?.role === 'coordenador' ? (
        <div className="stats-grid">
          <StatCard title="Total de Usuários" value={stats?.total_users} icon={<FaUsers />} iconClass="icon-users" />
          <StatCard title="Folgas Pendentes" value={stats?.pending_folgas} icon={<FaCalendarAlt />} iconClass="icon-folgas" />
          <StatCard title="Férias Pendentes" value={stats?.pending_ferias} icon={<FaCalendarAlt />} iconClass="icon-ferias" />
          <StatCard title="Trocas Pendentes" value={stats?.pending_trocas} icon={<FaExchangeAlt />} iconClass="icon-trocas" />
          <StatCard title="Pendências Abertas" value={stats?.pending_pendencias} icon={<FaTasks />} iconClass="icon-pendencias" />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard title="Minhas Folgas Pendentes" value={stats?.my_pending_folgas} icon={<FaCalendarAlt />} iconClass="icon-folgas" />
            <StatCard title="Minhas Férias Pendentes" value={stats?.my_pending_ferias} icon={<FaCalendarAlt />} iconClass="icon-ferias" />
            <StatCard title="Minhas Trocas Pendentes" value={stats?.my_pending_trocas} icon={<FaExchangeAlt />} iconClass="icon-trocas" />
            <StatCard title="Minhas Pendências" value={stats?.my_pending_pendencias} icon={<FaTasks />} iconClass="icon-pendencias" />
          </div>
          <div className="quick-actions">
            <Link to="/folgas" className="form-button">Pedir Folga</Link>
            <Link to="/ferias" className="form-button">Pedir Férias</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default PaginaInicial;