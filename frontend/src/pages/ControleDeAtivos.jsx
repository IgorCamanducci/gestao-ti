import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { FaPlus, FaWrench } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './ControleDeAtivos.css';
import './Usuarios.css';

// --- Menu de Ações com Portal ---
const ActionsMenu = ({ asset, position, onClose, onEdit, onDelete, onDecommission, onSendToMaintenance }) => {
  const menuRef = useRef();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div ref={menuRef} className="actions-menu" style={{ top: position.top, left: position.left }}>
      <button onClick={() => onEdit(asset)}>Editar</button>
      {asset.status !== 'Descartado' && <button onClick={() => onSendToMaintenance(asset)}>Enviar para Manutenção</button>}
      {asset.status !== 'Descartado' && <button onClick={() => onDecommission(asset)}>Dar Baixa</button>}
      <button onClick={() => onDelete(asset.id)} className="delete-button-text">Excluir</button>
    </div>,
    document.body
  );
};

// --- Modal para Adicionar/Editar Ativo ---
const AssetModal = ({ onClose, onSave, existingAsset, categories, fieldsConfig }) => {
  const [asset, setAsset] = useState(
    existingAsset || {
      name: '', asset_tag: '', category: categories[0]?.name || '', status: 'Em estoque', assigned_to: '', metadata: {}
    }
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setAsset(prev => ({ ...prev, [name]: value, metadata: {} }));
    } else {
      setAsset(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleMetadataChange = (fieldName, value) => {
    setAsset(prev => ({ ...prev, metadata: { ...prev.metadata, [fieldName]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave(asset, !!existingAsset);
    setLoading(false);
    if (success) onClose();
  };

  const customFields = fieldsConfig[asset.category] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingAsset ? 'Editar' : 'Adicionar Novo'} Ativo</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Categoria</label><select name="category" value={asset.category} onChange={handleChange} disabled={categories.length === 0}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          <div className="form-group"><label>Nome do Ativo</label><input name="name" type="text" value={asset.name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Etiqueta de Patrimônio</label><input name="asset_tag" type="text" value={asset.asset_tag} onChange={handleChange} required disabled={!!existingAsset} /></div>
          <div className="form-group"><label>Status</label><select name="status" value={asset.status} onChange={handleChange}><option>Em estoque</option><option>Em uso</option><option>Em manutenção</option></select></div>
          <div className="form-group"><label>Atribuído a (Opcional)</label><input name="assigned_to" type="text" placeholder="Nome do responsável" value={asset.assigned_to || ''} onChange={handleChange} /></div>
          
          {customFields.map(field => (
            <div className="form-group" key={field.id}>
              <label>{field.field_label}</label>
              <input type={field.field_type} value={asset.metadata?.[field.field_name] || ''} onChange={e => handleMetadataChange(field.field_name, e.target.value)} />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Ativo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Modal para Dar Baixa ---
const DecommissionModal = ({ asset, onClose, onDecommission }) => {
    const [reason, setReason] = useState('');
    const [decommissionDate, setDecommissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await onDecommission(asset.id, reason, decommissionDate);
        setLoading(false);
        if(success) onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Dar Baixa no Ativo: {asset.name}</h2>
                <p>O status do ativo será alterado para "Descartado". O ativo sairá desta tela de controle.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label htmlFor="decommission_date">Data da Baixa</label><input type="date" id="decommission_date" value={decommissionDate} onChange={(e) => setDecommissionDate(e.target.value)} required /></div>
                    <div className="form-group"><label htmlFor="decommission_reason">Motivo da Baixa (Opcional)</label><textarea id="decommission_reason" className="form-group" rows="4" value={reason} onChange={e => setReason(e.target.value)} /></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
                        <button type="submit" className="form-button" disabled={loading} style={{ background: '#dc3545' }}>{loading ? 'Confirmando...' : 'Confirmar Baixa'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Modal para Enviar para Manutenção ---
const MaintenanceModal = ({ asset, onClose, onSave }) => {
    const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await onSave(asset.id, { maintenanceDate, description });
        setLoading(false);
        if (success) onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Enviar para Manutenção</h2>
                <p>O status de <strong>{asset.name}</strong> será "Em manutenção" e um registro será criado no histórico.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label htmlFor="maintenance_date">Data de Envio</label><input id="maintenance_date" type="date" value={maintenanceDate} onChange={e => setMaintenanceDate(e.target.value)} required /></div>
                    <div className="form-group"><label htmlFor="description">Motivo / Descrição do Problema</label><textarea id="description" className="form-group" rows="4" value={description} onChange={e => setDescription(e.target.value)} required /></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
                        <button type="submit" className="form-button" disabled={loading}>{loading ? 'Enviando...' : 'Enviar para Manutenção'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};




// --- Componente Principal da Página ---
function ControleDeAtivos() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fieldsConfig, setFieldsConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ type: null, asset: null });
  const [menuState, setMenuState] = useState({ asset: null, position: null });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [assetsRes, categoriesRes, fieldsRes] = await Promise.all([
        supabase.from('ativos').select('*').neq('status', 'Descartado').order('name', { ascending: true }),
        supabase.from('asset_categories').select('*').order('name'),
        supabase.from('asset_category_fields').select('*').order('display_order')
      ]);
      
      if (assetsRes.error) throw assetsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (fieldsRes.error) throw fieldsRes.error;

      setAssets(assetsRes.data);
      const fetchedCategories = categoriesRes.data;
      setCategories(fetchedCategories);
      
      if (fetchedCategories.length > 0 && !activeTab) {
        setActiveTab(fetchedCategories[0].name);
      } else if (fetchedCategories.length === 0) {
        setActiveTab(null);
      }
      
      const categoryIdToNameMap = fetchedCategories.reduce((acc, cat) => ({...acc, [cat.id]: cat.name}), {});
      const fieldsByCatName = fieldsRes.data.reduce((acc, field) => {
        const catName = categoryIdToNameMap[field.category_id];
        if (catName) {
            if (!acc[catName]) acc[catName] = [];
            acc[catName].push(field);
        }
        return acc;
      }, {});
      setFieldsConfig(fieldsByCatName);
    } catch (error) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);
  
  const handleSaveAsset = async (assetData, isEditing) => {
    const toastId = toast.loading(isEditing ? 'Atualizando ativo...' : 'Criando novo ativo...');
    try {
      const { id, ...dataToSave } = assetData;
      if (isEditing) {
        const { error } = await supabase.from('ativos').update(dataToSave).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ativos').insert([dataToSave]).select();
        if (error) {
            if (error.message.includes('duplicate key value violates unique constraint "ativos_asset_tag_key"')) {
                throw new Error('A Etiqueta de Patrimônio informada já existe!');
            }
            throw error;
        }
      }
      toast.success(`Ativo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, { id: toastId });
      fetchInitialData();
      return true;
    } catch (error) {
      toast.error(`Erro: ${error.message}`, { id: toastId });
      return false;
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    const toastId = toast.loading('Excluindo ativo...');
    try {
      const { error } = await supabase.from('ativos').delete().eq('id', assetId);
      if (error) throw error;
      toast.success('Ativo excluído com sucesso!', { id: toastId });
      fetchInitialData();
    } catch(error) {
      toast.error('Erro ao excluir ativo: ' + error.message, { id: toastId });
    }
  };
  
  const handleDecommissionAsset = async (assetId, reason, decommissionDate) => {
    const toastId = toast.loading('Dando baixa no ativo...');
    try {
      const { error } = await supabase.from('ativos').update({
        status: 'Descartado',
        decommission_date: decommissionDate,
        decommission_reason: reason
      }).eq('id', assetId);
      if (error) throw error;
      toast.success('Ativo baixado com sucesso!', { id: toastId });
      fetchInitialData();
      return true;
    } catch (error) {
      toast.error('Erro ao dar baixa: ' + error.message, { id: toastId });
      return false;
    }
  };

  const handleSendToMaintenance = async (assetId, { maintenanceDate, description }) => {
    const toastId = toast.loading('Enviando para manutenção...');
    try {
        const { error: updateError } = await supabase.from('ativos').update({ status: 'Em manutenção' }).eq('id', assetId);
        if (updateError) throw updateError;
        const { error: insertError } = await supabase.from('manutencao_ativos').insert({
            asset_id: assetId,
            maintenance_date: maintenanceDate,
            description: description
        });
        if (insertError) throw insertError;
        toast.success('Ativo enviado para manutenção!', {id: toastId});
        fetchInitialData();
        return true;
    } catch (error) {
        toast.error('Erro: ' + error.message, {id: toastId});
        return false;
    }
  };

  const handleMenuClick = (asset, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const leftPosition = rect.right - 180;
    setMenuState({ asset, position: { top: rect.bottom + window.scrollY + 5, left: leftPosition + window.scrollX } });
  };
  
  const filteredAssets = useMemo(() => {
    if (!activeTab) return [];
    return assets.filter(asset => 
      (asset.category === activeTab) &&
      (searchTerm.trim() === '' || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [assets, activeTab, searchTerm]);
  
  const currentHeaders = useMemo(() => {
    const baseHeaders = ['Nome', 'Etiqueta', 'Status'];
    if (!activeTab || !fieldsConfig[activeTab]) {
      return baseHeaders;
    }
    const customFields = fieldsConfig[activeTab] || [];
    const customHeaders = customFields.map(f => f.field_label);
    return [...baseHeaders, ...customHeaders];
  }, [activeTab, fieldsConfig]);

  const getAssetValue = (asset, header) => {
    switch (header) {
      case 'Nome': return asset.name;
      case 'Etiqueta': return asset.asset_tag;
      case 'Status': return asset.status;
      default:
        const categoryFields = fieldsConfig[asset.category] || [];
        const fieldConfig = categoryFields.find(f => f.field_label === header);
        return fieldConfig && asset.metadata ? (asset.metadata[fieldConfig.field_name] || '---') : '---';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Em estoque': return 'status-em-estoque';
      case 'Em uso': return 'status-em-uso';
      case 'Em manutenção': return 'status-em-manutencao';
      default: return '';
    }
  };

  if (loading) return <div className="loading-state">Carregando ativos...</div>;

  return (
    <div onClick={() => setMenuState({ asset: null, position: null })}>
      <div className="assets-page-header">
        <h1>Controle de Ativos</h1>
        <div className="search-and-actions">
          <input type="search" placeholder="Buscar por nome ou etiqueta..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="form-button" onClick={() => setModalState({ type: 'add', asset: null })} disabled={categories.length === 0}>
            <FaPlus style={{ marginRight: '8px' }} />
            Novo Ativo
          </button>
        </div>
      </div>

      <div className="asset-tabs">
        {categories.map(category => (
          <button key={category.id} onClick={() => setActiveTab(category.name)} className={activeTab === category.name ? 'active' : ''}>{category.name}</button>
        ))}
      </div>

      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            <tr>
              {currentHeaders.map(header => <th key={header}>{header}</th>)}
              <th style={{textAlign: 'right'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 && activeTab ? (
              filteredAssets.length > 0 ? (
                filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    {currentHeaders.map(header => (
                      <td key={header} className={header === 'Status' ? getStatusClass(getAssetValue(asset, header)) : ''}>
                        {getAssetValue(asset, header)}
                      </td>
                    ))}
                    <td className="actions-cell">
                      <button className="actions-button" onClick={(e) => handleMenuClick(asset, e)}>
                        <HiDotsVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={currentHeaders.length + 1} className="empty-state">Nenhum ativo encontrado para esta categoria.</td></tr>
              )
            ) : (
              <tr><td colSpan={4} className="empty-state">
                <span>Nenhuma categoria de ativo foi criada. Vá para a <Link to="/configuracoes/categorias-ativos">página de gerenciamento</Link> para começar.</span>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {menuState.asset && (
        <ActionsMenu
          asset={menuState.asset}
          position={menuState.position}
          onClose={() => setMenuState({ asset: null, position: null })}
          onEdit={(assetToEdit) => { setModalState({ type: 'edit', asset: assetToEdit }); setMenuState({ asset: null, position: null }); }}
          onDelete={(assetId) => { handleDeleteAsset(assetId); setMenuState({ asset: null, position: null }); }}
          onDecommission={(assetToDecommission) => { setModalState({ type: 'decommission', asset: assetToDecommission }); setMenuState({ asset: null, position: null }); }}
          onSendToMaintenance={(assetToSend) => { setModalState({ type: 'maintenance', asset: assetToSend }); setMenuState({ asset: null, position: null }); }}
        />
      )}
      
      {modalState.type === 'add' && <AssetModal onClose={() => setModalState({ type: null, asset: null })} onSave={handleSaveAsset} existingAsset={null} categories={categories} fieldsConfig={fieldsConfig} />}
      {modalState.type === 'edit' && <AssetModal onClose={() => setModalState({ type: null, asset: null })} onSave={handleSaveAsset} existingAsset={modalState.asset} categories={categories} fieldsConfig={fieldsConfig} />}
      {modalState.type === 'decommission' && <DecommissionModal asset={modalState.asset} onClose={() => setModalState({ type: null, asset: null })} onDecommission={handleDecommissionAsset} />}
      {modalState.type === 'maintenance' && <MaintenanceModal asset={modalState.asset} onClose={() => setModalState({ type: null, asset: null })} onSave={handleSendToMaintenance} />}
    </div>
  );
}

export default ControleDeAtivos;