const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");

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

app.get('/produtos', (req, res) => {
  try {
    client.query("SELECT * FROM produtos", (err, result) => {
      if (err) {
        return console.error("Erro ao executar a query de select produtos.", err);
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
  // Verificar se o usuário existe
  client.query(
    "SELECT * FROM logins WHERE email = $1 AND senha = $2",
    [email, senha],
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

      res
        .status(200)
        .json({ success: true, message: "Login bem-sucedido" });
    }
  );
});

app.post("/register", (req, res) => {
  try {
    const { nome_usuario, email, senha } = req.body;
    client.query(
      "INSERT INTO logins (nome_usuario, email, senha) VALUES ($1, $2, $3)",
      [nome_usuario, email, senha], (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Erro ao executar a query de insert logins." });
        }
        res.status(200).json({ success: true, message: "Registro bem-sucedido" });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Erro ao processar o registro" });
  }
});


app.listen(config.port, () =>
  console.log("Servidor funcionando na porta " + config.port)
);

module.exports = app;
