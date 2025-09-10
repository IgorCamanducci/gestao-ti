import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import './TermosDeUso.css';

// Tipos são derivados do slug/label do manifest; mantemos enum lógico para regras (FISIA, multi-serial)

function TermosDeUso() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ativos, setAtivos] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [localDate, setLocalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [termNumber, setTermNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [templateHtml, setTemplateHtml] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  
  // Load manifest and choose template by human name
  const [manifest, setManifest] = useState([]);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState('');
  
  // Debug log for selectedTemplateSlug changes
  useEffect(() => {
    console.log('selectedTemplateSlug changed:', selectedTemplateSlug);
  }, [selectedTemplateSlug]);

  const printRef = useRef(null);

  // Fetch selectable data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [{ data: ativosData, error: ativosError }, { data: categoriesData, error: categoriesError }] = await Promise.all([
          supabase
            .from('ativos')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('asset_categories')
            .select('*')
            .order('name'),
        ]);
        if (ativosError) throw ativosError;
        if (categoriesError) throw categoriesError;
        setAtivos(ativosData || []);
        setCategories(categoriesData || []);
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Removido auto-seleção de template - usuário deve selecionar manualmente

  useEffect(() => {
    fetch('/termos/manifest.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : [])
      .then(m => {
        console.log('Manifest loaded:', m);
        setManifest(Array.isArray(m) ? m : []);
      })
      .catch(e => {
        console.error('Error loading manifest:', e);
        setManifest([]);
      });
  }, []);

  // Helper: pick best template slug by device type when user não escolhe manualmente
  const pickSlugByDeviceType = (list, type) => {
    if (!Array.isArray(list) || list.length === 0) return '';
    const lc = (s) => (s || '').toLowerCase();
    const match = list.find(item => {
      const text = lc(item.label || item.slug);
      if (type === 'notebook') return text.includes('notebook') || text.includes('desktop');
      if (type === 'desktop') return text.includes('desktop');
      if (type === 'celular') return text.includes('celular') || text.includes('phone');
      if (type === 'coletores') return text.includes('coletor');
      if (type === 'bateria') return text.includes('bateria');
      if (type === 'impressora_movel') return (text.includes('impressora') && (text.includes('movel') || text.includes('móvel') || text.includes('zq')));
      if (type === 'impressora_zebra') return text.includes('impressora');
      if (type === 'tablet') return text.includes('tablet');
      if (type === 'rfid') return text.includes('rf') || text.includes('rfid');
      return false;
    });
    return match?.slug || list[0].slug;
  };

  // Filtered assets - only notebooks (Dell and Lenovo)
  const filteredAssets = useMemo(() => {
    let filtered = ativos;
    
    // Filter to show only notebooks
    filtered = filtered.filter(asset => {
      const text = `${asset.category || ''} ${asset.model || ''} ${asset.hostname || ''} ${asset.brand || ''} ${asset.manufacturer || ''}`.toLowerCase();
      return text.includes('notebook') || text.includes('dell') || text.includes('lenovo');
    });
    
    // Filter by search term
    if (assetSearchTerm.trim()) {
      const searchLower = assetSearchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        (asset.serial_number && asset.serial_number.toLowerCase().includes(searchLower)) ||
        (asset.hostname && asset.hostname.toLowerCase().includes(searchLower)) ||
        (asset.model && asset.model.toLowerCase().includes(searchLower)) ||
        (asset.brand && asset.brand.toLowerCase().includes(searchLower)) ||
        (asset.manufacturer && asset.manufacturer.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [ativos, assetSearchTerm]);

  useEffect(() => {
    const chosen = manifest.find(m => m.slug === selectedTemplateSlug);
    if (!chosen) { setTemplateHtml(''); return; }
    // Força reload sem cache
    const timestamp = Date.now();
    fetch(`/termos/${chosen.file}?v=${timestamp}&nocache=${Math.random()}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(r => r.ok ? r.text() : '')
      .then(html => {
        console.log('Template carregado:', chosen.file);
        console.log('HTML preview:', html.substring(0, 500));
        setTemplateHtml(html || '');
      })
      .catch(e => {
        console.error('Erro ao carregar template:', e);
        setTemplateHtml('');
      });

    // Não precisa mais definir deviceType pois só temos notebooks
  }, [selectedTemplateSlug, manifest]);

  const isFormValid = useMemo(() => {
    const valid = fullName && matricula && selectedTemplateSlug && selectedAssetId;
    console.log('Form validation:', {
      fullName: !!fullName,
      matricula: !!matricula,
      selectedTemplateSlug: !!selectedTemplateSlug,
      selectedAssetId: !!selectedAssetId,
      isValid: valid
    });
    return valid;
  }, [fullName, matricula, selectedTemplateSlug, selectedAssetId]);

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(localDate + 'T00:00:00');
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return localDate; }
  }, [localDate]);

  const templateTitle = useMemo(() => {
    const chosen = manifest.find(m => m.slug === selectedTemplateSlug);
    const label = chosen?.label || 'Notebook';
    return `Termo de Responsabilidade - ${label}`;
  }, [manifest, selectedTemplateSlug]);

  // Get asset data for template filling
  const selectedAsset = useMemo(() => {
    return ativos.find(a => a.id === selectedAssetId);
  }, [ativos, selectedAssetId]);

  const templateBody = useMemo(() => {
    const nome = fullName || '________________';
    const mat = matricula || '________';
    const sn = selectedAsset?.serial_number || '____________';
    
    if (templateHtml) {
      // Replace placeholders
      const replacements = {
        '{{NOME}}': nome,
        '{{MATRICULA}}': mat,
        '{{SERIAL}}': sn,
        '{{DATA}}': formattedDate,
        '{{NUM_TERMO}}': termNumber || 'A definir',
      };
      let content = templateHtml;
      Object.entries(replacements).forEach(([k, v]) => {
        content = content.split(k).join(v);
      });
      return (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    
    return (
      <>
        <p>Declaro que recebi o equipamento corporativo sob minha responsabilidade, comprometendo-me a zelar pelo bom uso e conservação, bem como observar as políticas internas da empresa.</p>
        <p><strong>Colaborador:</strong> {nome} &nbsp; <strong>Matrícula:</strong> {mat}</p>
        <p><strong>Identificação:</strong> {sn}</p>
        <p>Estou ciente de que o equipamento deve ser utilizado exclusivamente para fins profissionais e deverá ser devolvido em caso de desligamento, troca ou solicitação do setor de TI.</p>
      </>
    );
  }, [fullName, matricula, selectedAsset, formattedDate, termNumber, templateHtml]);

  const buildFilledHtml = () => {
    const nome = fullName || '________________';
    const mat = matricula || '________';
    const sn = selectedAsset?.serial_number || '____________';
    
    const replacements = {
      '{{NOME}}': nome,
      '{{MATRICULA}}': mat,
      '{{SERIAL}}': sn,
      '{{DATA}}': formattedDate,
      '{{NUM_TERMO}}': termNumber || 'A definir',
    };
    let content = templateHtml || '';
    
    // Substitui todos os placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => { 
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      content = content.replace(regex, value);
    });
    
    // Heurísticas quando placeholders não existem no HTML convertido
    const heuristics = [
      // Nome e matrícula (variações comuns) - matrícula em negrito
      { pattern: /(Eu,\s*)(__+|_{3,})/i, replace: (m, p1) => `${p1}${nome}` },
      { pattern: /(colaborador\(a\)[^\n]*?)(__+|_{3,})/i, replace: (m, p1) => `${p1}${nome}` },
      { pattern: /(matr[íi]cula\s*n[ºo]\s*)(__+|_{3,})/i, replace: (m, p1) => `${p1}<strong>${mat}</strong>` },
      { pattern: /(fisia\s+matr[íi]cula\s*n[ºo]?\s*)(__+|_{3,})/i, replace: (m, p1) => `${p1}<strong>${mat}</strong>` },

      // Série: "Nº de série" e também variações com "SN:" / "S/N:" - em negrito
      { pattern: /(Número de Série:\s*<\/strong><\/p><\/th><th><p>)(__+|_{3,})/i, replace: (m, p1) => `${p1}<strong>${sn}</strong>` },
      { pattern: /(n[ºo]\s*de\s*s[ée]rie[^\n:]*?[:\s]*)(__+|_{3,})/i, replace: (m, p1) => `${p1}<strong>${sn}</strong>` },
      { pattern: /\b(s\/?n)\s*[:\-]?\s*(__+|_{3,})/i, replace: () => `SN: <strong>${sn}</strong>` },

      // Data
      { pattern: /(data[:\s]*)(__+|_{3,})/i, replace: (m, p1) => `${p1}${formattedDate}` },
    ];
    heuristics.forEach(h => { content = content.replace(h.pattern, h.replace); });

    // Heurísticas tolerantes a tags para padrões específicos muito comuns nos seus modelos
    const tolerantReplacements = [
      {
        pattern: /(matr[íi]cula\s*n[ºo]\s*)(?:<[^>]*>|\s|_)+/i,
        replace: (m, p1) => `${p1}<strong>${mat}</strong> `,
      },
      {
        pattern: /(sn:\s*)(?:<[^>]*>|\s|_)+/i,
        replace: (m, p1) => `${p1}<strong>${sn}</strong> `,
      },
    ];
    tolerantReplacements.forEach(h => { content = content.replace(h.pattern, h.replace); });

    // Se ainda assim não houver conteúdo do template, gera um fallback consistente
    if (!content || content.trim() === '') {
      content = `
        <div class="termo-conteudo">
          <h2 style="text-align:center;margin:0 0 12px 0">${templateTitle}</h2>
          <p>Declaro que recebi o equipamento corporativo sob minha responsabilidade, comprometendo-me a zelar pelo bom uso e conservação, bem como observar as políticas internas da empresa.</p>
          <p><strong>Colaborador:</strong> ${nome} &nbsp; <strong>Matrícula:</strong> ${mat}</p>
          <p><strong>Identificação:</strong> ${sn}</p>
          <div class="sign-row">
            <div class="sign"><div class="line"></div><div>Colaborador</div></div>
            <div class="sign"><div class="line"></div><div>Responsável TI</div></div>
          </div>
          <div style="margin-top:8px">Data: ${formattedDate}</div>
        </div>`;
    }
    const shell = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Termo de Responsabilidade</title>
  <style>
    @page { 
      size: A4; 
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body { 
      font: 12px/1.4 'Times New Roman', serif; 
      color: #000; 
      background: white;
      width: 100%;
      height: 100%;
    }
    p, div, span, td, th, li {
      font-size: 12px !important;
    }
    table {
      font-size: 12px;
    }
    h1, h2, h3 {
      font-size: 14px;
    }
    .document-container {
      width: 100%;
      min-height: 100vh;
      padding: 0;
    }
    .brand { 
      display: flex; 
      align-items: center; 
      gap: 8px; 
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ccc;
    }
    .brand img { 
      height: 24px; 
    }
    .termo-conteudo { 
      padding: 0;
      line-height: 1.5;
    }
    h1, h2, h3 { 
      page-break-after: avoid;
      margin-bottom: 10px;
    }
    p {
      margin-bottom: 8px;
      text-align: justify;
    }
    .sign-row { 
      display: flex; 
      gap: 40px; 
      margin-top: 40px; 
      page-break-inside: avoid;
    }
    .sign { 
      flex: 1; 
      text-align: center; 
    }
    .sign .line { 
      border-top: 1px solid #000; 
      margin-top: 30px; 
      padding-top: 5px;
    }
    strong { 
      font-weight: bold; 
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 8px;
    }
    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="brand">
      <img src="/gti-icon.svg" alt="FISIA" />
    </div>
    <div class="termo-conteudo">
      ${content}
    </div>
  </div>
</body>
</html>`;
    return shell;
  };

  const handlePrint = () => {
    try {
      const html = buildFilledHtml();
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Aguarda a renderização para imprimir
      setTimeout(() => { printWindow.print(); }, 300);
      // Limpa formulário após comando de impressão
      setTimeout(() => {
        setSelectedAssetId(null);
        setFullName('');
        setMatricula('');
        setAssetSearchTerm('');
        setTermNumber('');
      }, 600);
    } catch (e) {
      console.error('Falha ao imprimir:', e);
    }
  };

  const buildHtmlSnapshot = () => buildFilledHtml();

  const ensureTermNumber = async () => {
    if (termNumber) return termNumber;
    try {
      const { data } = await supabase
        .from('termos_uso')
        .select('term_number')
        .order('term_number', { ascending: false })
        .limit(1);
      const last = (data && data[0]?.term_number) ? parseInt(data[0].term_number, 10) : 0;
      return String(last + 1);
    } catch {
      // fallback simples por timestamp
      return String(Math.floor(Date.now() / 1000));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const nextNumber = await ensureTermNumber();
      const html = buildHtmlSnapshot();
      const payload = {
        user_id: user?.id || null,
        full_name: fullName || null,
        matricula: matricula || null,
        device_type: deviceType,
        asset_id: selectedAssetId || null,
        serial_number: serialNumber || null,
        imei: imei || null,
        term_number: nextNumber,
        term_version: 'v1',
        html_snapshot: html,
        printed_by: user?.id || null,
      };
      // Tenta salvar, mas não bloqueia geração de PDF se falhar
      try {
        const { error } = await supabase.from('termos_uso').insert(payload);
        if (error) console.warn('Falha ao salvar no banco:', error.message);
      } catch (dbErr) {
        console.warn('Erro Supabase:', dbErr?.message);
      }
      setTermNumber(nextNumber);

      // Gera PDF a partir do HTML preenchido
      if (window.html2pdf) {
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-10000px';
        temp.innerHTML = html;
        document.body.appendChild(temp);
        const opt = {
          margin:       10,
          filename:     `termo_${nextNumber}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await window.html2pdf().set(opt).from(temp).save();
        document.body.removeChild(temp);
      }
      alert('Termo salvo e PDF gerado! Nº ' + nextNumber);
    } catch (e) {
      console.error('Erro ao salvar termo:', e);
      alert('O PDF foi gerado, mas houve erro ao salvar no banco.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="assets-page-container termos-container">
      <style>
        {`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print, .topbar, .sidebar, .footer { display: none !important; }
          .page-content.refined { padding: 0; }
        }
        .term-paper {
          background: var(--bg-paper, #fff);
          color: var(--primary-text-color);
          padding: 24px;
          border: 1px solid var(--border-color);
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.5;
        }
        .term-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .term-title { font-size: 18px; font-weight: 700; }
        .term-meta { font-size: 12px; color: var(--secondary-text-color); }
        .sign-row { display: flex; gap: 24px; margin-top: 32px; }
        .sign { flex: 1; text-align: center; }
        .sign .line { border-top: 1px solid var(--border-color); margin-top: 40px; }
        `}
      </style>

      <div className="assets-page-header termos-header">
        <div className="header-content">
          <h1>Termos de Uso</h1>
        </div>
        <div className="termos-actions no-print">
          <button className="form-button" onClick={handlePrint} disabled={!isFormValid}>Imprimir</button>
          <button className="form-button" onClick={handleSave} disabled={!isFormValid || saving}>{saving ? 'Gerando PDF...' : 'Salvar (PDF)'}</button>
        </div>
      </div>

      <div className="section-card termos-section no-print">
        <div className="section-header">
          <h3 className="section-title">Dados do Termo</h3>
        </div>
        <div className="section-content">
          <div className="termos-grid-2">
            <div>
              <label>Modelo do Termo</label>
              <select className="select" value={selectedTemplateSlug} onChange={e => setSelectedTemplateSlug(e.target.value)}>
                <option value="">Selecionar template...</option>
                {manifest.map(m => (
                  <option key={m.slug} value={m.slug}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Data</label>
              <input className="input" type="date" value={localDate} onChange={e => setLocalDate(e.target.value)} />
            </div>
          </div>

          <div className="termos-grid-1">
            <div>
              <label>Selecionar Notebook</label>
              <input 
                className="input" 
                type="text" 
                value={assetSearchTerm} 
                onChange={e => {
                  setAssetSearchTerm(e.target.value);
                  // Auto-select asset by exact serial number match
                  const searchValue = e.target.value.toLowerCase().trim();
                  if (searchValue) {
                    const exactMatch = filteredAssets.find(a => 
                      (a.serial_number && a.serial_number.toLowerCase() === searchValue) ||
                      (a.hostname && a.hostname.toLowerCase() === searchValue)
                    );
                    if (exactMatch) {
                      setSelectedAssetId(exactMatch.id);
                    } else {
                      setSelectedAssetId(null);
                    }
                  } else {
                    setSelectedAssetId(null);
                  }
                }}
                placeholder="Digite o número de série do notebook..."
                list="assets-list"
              />
              <datalist id="assets-list">
                {filteredAssets.map(a => (
                  <option key={a.id} value={a.serial_number || a.hostname || a.id}>
                    {a.serial_number || a.hostname || a.id}
                  </option>
                ))}
              </datalist>
              {selectedAssetId && (
                <div className="selected-asset-info">
                  <small>✅ Notebook selecionado: {selectedAsset?.brand || selectedAsset?.manufacturer} {selectedAsset?.model} - {selectedAsset?.serial_number}</small>
                </div>
              )}
            </div>
          </div>

          <div className="termos-grid-2">
            <div>
              <label>Nome Completo</label>
              <input className="input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Digite o nome completo" />
            </div>
            <div>
              <label>Matrícula</label>
              <input className="input" type="text" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Digite a matrícula" />
            </div>
          </div>
        </div>
      </div>


      {loading && (
        <div className="section-card"><div className="section-content">Carregando dados...</div></div>
      )}
    </div>
  );
}

export default TermosDeUso;


