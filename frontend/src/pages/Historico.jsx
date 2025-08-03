import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import './Historico.css';

function Historico() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Esta query busca o histórico e já traz os dados relacionados do ativo e do perfil
        const { data, error } = await supabase
          .from('asset_history')
          .select(`
            id,
            event_type,
            event_date,
            ativos ( asset_tag, name, metadata ),
            profiles ( full_name )
          `)
          .order('event_date', { ascending: false });

        if (error) throw error;
        setHistory(data);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error.message);
        setError("Não foi possível carregar o histórico.");
        toast.error("Não foi possível carregar o histórico.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div>Carregando histórico...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="history-page">
      <h1>Histórico de Movimentação de Ativos</h1>
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Data do Evento</th>
              <th>Tipo</th>
              <th>Nome do Ativo</th>
              <th>Etiqueta</th>
              <th>Responsável</th>
              <th>Modelo</th>
              <th>Fabricante</th>
              <th>Número de Série</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.event_date)}</td>
                  <td>
                    <span className={`event-${item.event_type}`}>{item.event_type}</span>
                  </td>
                  <td>{item.ativos?.name || 'N/A'}</td>
                  <td>{item.ativos?.asset_tag || 'N/A'}</td>
                  <td>{item.profiles?.full_name || 'N/A'}</td>
                  <td>{item.ativos?.metadata?.model || '---'}</td>
                  <td>{item.ativos?.metadata?.brand || '---'}</td>
                  <td>{item.ativos?.metadata?.serial_number || '---'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                  Nenhum registro de histórico encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Garante que o arquivo possa ser importado corretamente
export default Historico;