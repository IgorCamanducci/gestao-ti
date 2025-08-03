import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './ControleDeAtivos.css';
import './Usuarios.css'; // Reutilizando estilos da tabela e modais

// --- Componente do Menu de Ações com Portal ---
const ActionsMenu = ({ asset, position, onClose, onEdit, onDelete, onViewHistory }) => {
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
      <button onClick={() => onViewHistory(asset)}>Ver Histórico</button>
      <button onClick={() => onDelete(asset.id)} className="delete-button-text">Excluir</button>
    </div>,
    document.body
  );
};

// --- Componente do Modal para Adicionar/Editar Ativo ---
const AssetModal = ({ onClose, onSave, profiles, existingAsset, categories, fieldsConfig }) => {
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
          <div className="form-group">
            <label>Categoria</label>
            <select name="category" value={asset.category} onChange={handleChange} disabled={categories.length === 0}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Nome do Ativo</label><input name="name" type="text" value={asset.name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Etiqueta de Patrimônio</label><input name="asset_tag" type="text" value={asset.asset_tag} onChange={handleChange} required /></div>
          <div className="form-group"><label>Status</label><select name="status" value={asset.status} onChange={handleChange}><option>Em estoque</option><option>Em uso</option><option>Manutenção</option><option>Descartado</option></select></div>
          <div className="form-group"><label>Atribuído a (Opcional)</label><select name="assigned_to" value={asset.assigned_to || ''} onChange={handleChange}><option value="">Ninguém</option>{profiles.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}</select></div>

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

// --- Componente Principal da Página ---
function ControleDeAtivos() {
  const [assets, setAssets] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fieldsConfig, setFieldsConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, asset: null });
  const [menuState, setMenuState] = useState({ asset: null, position: null });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [assetsRes, profilesRes, categoriesRes, fieldsRes] = await Promise.all([
        supabase.from('ativos').select('*').order('name', { ascending: true }),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('asset_categories').select('*').order('name'),
        supabase.from('asset_category_fields').select('*').order('display_order')
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (fieldsRes.error) throw fieldsRes.error;

      setAssets(assetsRes.data);
      setProfiles(profilesRes.data);
      setCategories(categoriesRes.data);

      if (categoriesRes.data.length > 0 && !activeTab) {
        setActiveTab(categoriesRes.data[0].name);
      } else if (categoriesRes.data.length === 0) {
        setActiveTab(null);
      }

      const categoryIdToNameMap = categoriesRes.data.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {});
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
      dataToSave.assigned_to = dataToSave.assigned_to || null;

      if (isEditing) {
        const { error } = await supabase.from('ativos').update(dataToSave).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ativos').insert([dataToSave]);
        if (error) throw error;
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
    if (!window.confirm('Tem certeza que deseja excluir este ativo?')) return;
    const toastId = toast.loading('Excluindo ativo...');
    try {
      const { error } = await supabase.from('ativos').delete().eq('id', assetId);
      if (error) throw error;
      toast.success('Ativo excluído com sucesso!', { id: toastId });
      fetchInitialData();
    } catch (error) {
      toast.error('Erro ao excluir ativo: ' + error.message, { id: toastId });
    }
  };

  const handleMenuClick = (asset, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const leftPosition = rect.right - 180;
    setMenuState({ asset, position: { top: rect.bottom + window.scrollY + 5, left: leftPosition + window.scrollX } });
  };

  const profileMap = useMemo(() => profiles.reduce((map, p) => ({ ...map, [p.id]: p.full_name }), {}), [profiles]);

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
    if (!activeTab || !fieldsConfig[activeTab]) return [];
    const customFields = fieldsConfig[activeTab] || [];
    return customFields.map(f => f.field_label);
  }, [activeTab, fieldsConfig]);


  const getAssetValue = (asset, header) => {
    switch (header) {
      case 'Nome': return asset.name;
      case 'Etiqueta': return asset.asset_tag;
      case 'Status': return asset.status;
      case 'Atribuído a': return asset.assigned_to ? profileMap[asset.assigned_to] : '---';
      default:
        const categoryFields = fieldsConfig[asset.category] || [];
        const fieldConfig = categoryFields.find(f => f.field_label === header);
        return fieldConfig && asset.metadata ? (asset.metadata[fieldConfig.field_name] || '---') : '---';
    }
  };

  if (loading) return <div>Carregando ativos...</div>;

  return (
    <div onClick={() => setMenuState({ asset: null, position: null })}>
      <div className="assets-page-header">
        <h1>Controle de Ativos</h1>
        <div className="search-and-actions">
          <input type="search" placeholder="Buscar por nome ou etiqueta..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="form-button" onClick={() => setModalState({ isOpen: true, asset: null })}>
            <FaPlus style={{ marginRight: '8px' }} />
            Novo Ativo
          </button>
        </div>
      </div>

      <div className="asset-tabs">
        {/* As abas agora são 100% lidas do banco de dados! */}
        {categories.map(category => (
          <button key={category.id} onClick={() => setActiveTab(category.name)} className={activeTab === category.name ? 'active' : ''}>{category.name}</button>
        ))}
      </div>

      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            <tr>
              {currentHeaders.map(header => <th key={header}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map(asset => (
                <tr key={asset.id}>
                  {currentHeaders.map(header => <td key={header}>{getAssetValue(asset, header)}</td>)}
                  <td className="actions-cell">
                    <button className="actions-button" onClick={(e) => handleMenuClick(asset, e)}>
                      <HiDotsVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={currentHeaders.length + 1} style={{ textAlign: 'center', padding: '32px' }}>
                {categories.length > 0 ? 'Nenhum ativo encontrado para esta categoria.' : <span>Nenhuma categoria de ativo foi criada. Vá para a <Link to="/configuracoes/categorias-ativos">página de gerenciamento</Link> para começar.</span>}
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
          onEdit={(assetToEdit) => { setModalState({ isOpen: true, asset: assetToEdit }); setMenuState({ asset: null, position: null }); }}
          onDelete={(assetId) => { handleDeleteAsset(assetId); setMenuState({ asset: null, position: null }); }}
          onViewHistory={() => { toast('Histórico de manutenção em breve!'); setMenuState({ asset: null, position: null }); }}
        />
      )}

      {modalState.isOpen && (
        <AssetModal
          onClose={() => setModalState({ isOpen: false, asset: null })}
          onSave={handleSaveAsset}
          profiles={profiles}
          existingAsset={modalState.asset}
          categories={categories}
          fieldsConfig={fieldsConfig}
        />
      )}
    </div>
  );
}

export default ControleDeAtivos