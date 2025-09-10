import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './GerenciarCategorias.css';
import './Usuarios.css'; // Reutilizando estilos de formulário para consistência

// --- Componente para o formulário de adicionar novo campo ---
const AddFieldForm = ({ categoryId, onFieldAdded }) => {
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddField = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    // Cria um 'nome de máquina' a partir do nome de exibição (ex: "Número de Série" -> "numero_de_serie")
    const field_name = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    
    const { error } = await supabase.from('asset_category_fields').insert([
      { category_id: categoryId, field_name, field_label: label.trim(), field_type: 'text' } // Por padrão, criamos campos do tipo texto
    ]);

    if (error) {
      toast.error(error.message);
    } else {
      setLabel('');
      onFieldAdded(); // Avisa o componente pai para recarregar os dados
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAddField} className="add-field-form">
      <input 
        type="text" 
        className="form-group" // Classe para padronizar o estilo
        placeholder="Nome do novo campo (ex: Nº de Série)" 
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <button type="submit" className="form-button add-button" disabled={loading}><FaPlus /></button>
    </form>
  );
};

// --- Componente para editar categoria ---
const EditCategoryForm = ({ category, onSave, onCancel }) => {
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('asset_categories')
      .update({ name: name.trim() })
      .eq('id', category.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Categoria atualizada!');
      onSave();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="edit-category-form">
      <input 
        type="text" 
        className="form-group"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da categoria"
      />
      <div className="edit-actions">
        <button type="submit" className="form-button save-button" disabled={loading}>
          <FaSave style={{ marginRight: '4px' }} />
          Salvar
        </button>
        <button type="button" className="form-button cancel-button" onClick={onCancel}>
          <FaTimes style={{ marginRight: '4px' }} />
          Cancelar
        </button>
      </div>
    </form>
  );
};

// --- Componente para editar campo ---
const EditFieldForm = ({ field, onSave, onCancel }) => {
  const [label, setLabel] = useState(field.field_label);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('asset_category_fields')
      .update({ field_label: label.trim() })
      .eq('id', field.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Campo atualizado!');
      onSave();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="edit-field-form">
      <input 
        type="text" 
        className="form-group"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome do campo"
      />
      <div className="edit-actions">
        <button type="submit" className="form-button save-button" disabled={loading}>
          <FaSave />
        </button>
        <button type="button" className="form-button cancel-button" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>
    </form>
  );
};

// --- Componente Principal da Página de Gerenciamento ---
function GerenciarCategorias() {
  const [categories, setCategories] = useState([]);
  const [fields, setFields] = useState({}); // Um objeto para mapear campos por ID de categoria
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState(null); // Controla qual card está aberto
  const [editingCategoryId, setEditingCategoryId] = useState(null); // Controla qual categoria está sendo editada
  const [editingFieldId, setEditingFieldId] = useState(null); // Controla qual campo está sendo editado

  const fetchData = async () => {
    try {
      setLoading(true);
      // Busca todas as categorias
      const { data: categoriesData, error: catError } = await supabase.from('asset_categories').select('*').order('name');
      if (catError) throw catError;
      setCategories(categoriesData);

      // Busca todos os campos de uma vez e os agrupa por categoria
      const { data: fieldsData, error: fieldError } = await supabase.from('asset_category_fields').select('*');
      if (fieldError) throw fieldError;
      
      const fieldsByCategoryId = fieldsData.reduce((acc, field) => {
        const { category_id } = field;
        if (!acc[category_id]) {
          acc[category_id] = [];
        }
        acc[category_id].push(field);
        return acc;
      }, {});
      setFields(fieldsByCategoryId);

    } catch (error) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const toastId = toast.loading('Criando categoria...');
    const { error } = await supabase.from('asset_categories').insert([{ name: newCategoryName.trim() }]);
    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success('Categoria criada!', { id: toastId });
      setNewCategoryName('');
      fetchData();
    }
  };
  
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Tem certeza? Excluir uma categoria também excluirá todos os seus campos.')) {
      const toastId = toast.loading('Excluindo categoria...');
      const { error } = await supabase.from('asset_categories').delete().eq('id', categoryId);
      if (error) toast.error(error.message, { id: toastId });
      else {
        toast.success('Categoria excluída!', { id: toastId });
        fetchData();
      }
    }
  };
  
  const handleDeleteField = async (fieldId) => {
    if (window.confirm('Tem certeza que deseja excluir este campo?')) {
      const toastId = toast.loading('Excluindo campo...');
      const { error } = await supabase.from('asset_category_fields').delete().eq('id', fieldId);
      if (error) toast.error(error.message, { id: toastId });
      else {
        toast.success('Campo excluído!', { id: toastId });
        fetchData();
      }
    }
  };

  const handleEditCategory = (categoryId) => {
    setEditingCategoryId(categoryId);
  };

  const handleSaveCategory = () => {
    setEditingCategoryId(null);
    fetchData();
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
  };

  const handleEditField = (fieldId) => {
    setEditingFieldId(fieldId);
  };

  const handleSaveField = () => {
    setEditingFieldId(null);
    fetchData();
  };

  const handleCancelEditField = () => {
    setEditingFieldId(null);
  };

  // Função para abrir/fechar o card (accordion)
  const toggleExpand = (categoryId) => {
    setExpandedCategoryId(prevId => (prevId === categoryId ? null : categoryId));
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>🏷️ Gerenciar Categorias de Ativos</h1>
        <div className="search-and-actions">
          <form onSubmit={handleAddCategory} className="add-category-form">
            <input 
              type="text" 
              className="search-input"
              placeholder="Nome da nova aba (ex: Monitores)" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="form-button">
              <FaPlus style={{ marginRight: '8px' }} />
              Criar Nova Categoria
            </button>
          </form>
        </div>
      </div>
      
      <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--secondary-text-color)' }}>
        Crie e organize as "abas" e os "cabeçalhos" que aparecerão na página de Controle de Ativos.
      </p>

      <div className="categories-container">
        {categories.map(cat => (
          <div key={cat.id} className="category-card">
            <div className="category-card-header" onClick={() => toggleExpand(cat.id)}>
              {editingCategoryId === cat.id ? (
                <EditCategoryForm 
                  category={cat}
                  onSave={handleSaveCategory}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <>
                  <h3>{cat.name}</h3>
                  <div className='category-card-controls'>
                    <button 
                      className="edit-button" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleEditCategory(cat.id); 
                      }} 
                      title="Editar Categoria"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-button" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteCategory(cat.id); 
                      }} 
                      title="Excluir Categoria"
                    >
                      <FaTrash />
                    </button>
                    {expandedCategoryId === cat.id ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </>
              )}
            </div>
            {expandedCategoryId === cat.id && editingCategoryId !== cat.id && (
              <div className="category-card-body">
                <ul className="field-list">
                  {(fields[cat.id] || []).map(field => (
                    <li key={field.id}>
                      {editingFieldId === field.id ? (
                        <EditFieldForm 
                          field={field}
                          onSave={handleSaveField}
                          onCancel={handleCancelEditField}
                        />
                      ) : (
                        <>
                          <span>{field.field_label}</span>
                          <div className="field-controls">
                            <button 
                              className="edit-button" 
                              onClick={() => handleEditField(field.id)} 
                              title="Editar Campo"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="delete-button" 
                              onClick={() => handleDeleteField(field.id)} 
                              title="Excluir Campo"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                  {(!fields[cat.id] || fields[cat.id].length === 0) && <p style={{color: 'var(--secondary-text-color)', margin: 0}}>Nenhum campo customizado para esta categoria.</p>}
                </ul>
                <AddFieldForm categoryId={cat.id} onFieldAdded={fetchData} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GerenciarCategorias;