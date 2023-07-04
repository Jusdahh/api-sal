const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");
const crypto = require("crypto");
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Gera uma chave secreta aleatória
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
};
const secretKey = generateSecretKey();

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());

var conString = config.urlConnection;
var client = new Client(conString);
client.connect(function (err) {
  if (err) {
    return console.error("Não foi possível conectar ao banco.", err);
  }
  client.query("SELECT NOW()", (err, result) => {
    if (err) {
      return console.error("Erro ao executar a query.", err);
    }
    console.log(result.rows[0]);
  });
});

app.get("/", (req, res) => {
  console.log("Response ok.");
  res.send("Ok – Servidor disponível.");
});


const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de autenticação não fornecido' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token de autenticação inválido' });
    }

    req.id = decoded.id;
    next();
  });
};

// Rota protegida por autenticação
app.get('/produtos', verifyToken, (req, res) => {
  try {
    client.query("SELECT * FROM produtos", (err, result) => {
      if (err) {
        return console.error(
          "Erro ao executar a query de select produtos.",
          err
        );
      }
      res.send(result.rows);
      console.log("Chamou get produtos");
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/produtos/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    client.query(
      "SELECT * FROM produtos WHERE id = $1",
      [id],
      (err, result) => {
        if (err) {
          return console.error(
            "Erro ao executar a query de select produtos.",
            err
          );
        }
        res.send(result.rows);
        console.log("Chamou get produtos/:id");
      }
    );
  } catch (error) {
    console.log(error);
  }
});

app.get("/logins", (req, res) => {
  try {
    client.query("SELECT * FROM logins", (err, result) => {
      if (err) {
        return console.error("Erro ao executar a query de select logins.", err);
      }
      res.send(result.rows);
      console.log("Chamou get logins");
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  // Verificar se o usuário existe (substitua com sua lógica de banco de dados)
  client.query(
    "SELECT * FROM logins WHERE email = $1",
    [email],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Erro ao executar a query select logins.",
          });
      }

      if (result.rowCount === 0) {
        return res
          .status(401)
          .json({ success: false, message: "Credenciais inválidas" });
      }

      const user = result.rows[0];

      // Verificar a senha
      bcrypt.compare(senha, user.senha, (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Erro ao comparar as senhas" });
        }

        if (!result) {
          return res
            .status(401)
            .json({ success: false, message: "Credenciais inválidas" });
        }

        // Gerar o token de autenticação
        const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: "1h" });

        res
          .status(200)
          .json({ success: true, message: "Login bem-sucedido", token: token });
      });
    }
  );
});

app.post("/register", (req, res) => {
  const { nome_usuario, email, senha } = req.body;

  // Gerar o hash da senha
  bcrypt.hash(senha, 10, (err, hashedPassword) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Erro ao criar hash da senha" });
    }

    // Salvar usuário no banco de dados (substitua com sua lógica de banco de dados)
    client.query(
      "INSERT INTO logins (nome_usuario, email, senha) VALUES ($1, $2, $3)",
      [nome_usuario, email, hashedPassword],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({
              success: false,
              message: "Erro ao executar a query de insert logins.",
            });
        }
        res
          .status(200)
          .json({ success: true, message: "Registro bem-sucedido" });
      }
    );
  });
});

app.listen(config.port, () =>
  console.log("Servidor funcionando na porta " + config.port)
);

module.exports = app;
