// Importa os frameworks
const express = require('express');
const cors = require('cors'); // Importa o cors

// Cria uma instância do Express
const app = express();

// --- CONFIGURAÇÃO DOS MIDDLEWARES ---
// Habilita o CORS para permitir requisições do nosso frontend
app.use(cors()); 
// Habilita o Express a ler o corpo (body) de requisições em formato JSON
app.use(express.json()); 

// Define a porta do servidor
const PORT = process.env.PORT || 3001;

// --- NOSSAS ROTAS (ENDPOINTS) ---

// Rota de teste que já tínhamos
app.get('/', (req, res) => {
  res.send('<h1>Backend da Gestão de TI está no ar!</h1>');
});

// NOVA ROTA: Rota de Login
app.post('/api/login', (req, res) => {
  // O 'req.body' contém os dados que o frontend enviou (email e senha)
  const { email, password } = req.body;

  console.log('--- Nova Tentativa de Login Recebida ---');
  console.log('Email recebido:', email);
  console.log('Senha recebida:', password);

  // Por enquanto, apenas respondemos com sucesso se recebemos os dados.
  // No futuro, aqui é onde vamos checar no banco de dados se o usuário existe.
  if (email && password) {
    res.status(200).json({ success: true, message: 'Login recebido pelo backend!' });
  } else {
    res.status(400).json({ success: false, message: 'E-mail ou senha não fornecidos.' });
  }
});


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});