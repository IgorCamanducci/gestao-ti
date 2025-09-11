const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const termosDir = path.resolve(__dirname, '..', 'termos');
const outDir = path.resolve(__dirname, '..', 'frontend', 'public', 'termos');
const manifestPath = path.join(outDir, 'manifest.json');

const slugify = (name) => name
  .toLowerCase()
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const injectPlaceholders = (html) => {
  // Troca conteúdos amarelados no DOCX por placeholders. Como não temos os highlights aqui,
  // deixamos marcadores padrão para o usuário substituir manualmente se necessário.
  // Garantimos que existam os placeholders-chave no topo do conteúdo.
  const header = `
    <div style="display:none">
      {{NOME}} {{MATRICULA}} {{SERIAL}} {{IMEI}} {{DATA}} {{NUM_TERMO}}
    </div>
  `;
  return header + html;
};

async function convertAll() {
  if (!fs.existsSync(termosDir)) {
    console.error('Pasta Termos não encontrada:', termosDir);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(termosDir).filter(f => f.toLowerCase().endsWith('.docx'));
  const manifest = [];
  for (const file of files) {
    const baseLabel = file.replace(/\.docx$/i, '');
    const slug = slugify(baseLabel);
    const target = `${slug}.html`;
    const input = path.join(termosDir, file);
    try {
      const { value: rawHtml } = await mammoth.convertToHtml({ path: input }, {
        styleMap: [
          'p[style-name="Heading 1"] => h2:fresh',
          'p[style-name="Heading 2"] => h3:fresh'
        ]
      });
      const cleaned = injectPlaceholders(rawHtml);
      const wrapped = `<div class="termo-conteudo">${cleaned}</div>`;
      fs.writeFileSync(path.join(outDir, target), wrapped, 'utf8');
      console.log('Gerado:', target, 'a partir de', file);
      manifest.push({ label: baseLabel, slug, file: target });
    } catch (e) {
      console.error('Falha ao converter', file, e.message);
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

convertAll();


