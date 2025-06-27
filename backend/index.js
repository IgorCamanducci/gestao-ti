// Importa o framework Express
const express = require('express');

// Cria uma instância do Express
const app = express();

// Define a porta do servidor. O Render nos dá uma porta dinamicamente através de process.env.PORT
const PORT = process.env.PORT || 3001;

// Cria uma rota de teste na raiz do servidor ('/')
app.get('/', (req, res) => {
  res.send('<h1>Backend da Gestão de TI está no ar!</h1><p>Parabéns, a conexão funcionou.</p>');
});

// Inicia o servidor e o faz "escutar" por requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});