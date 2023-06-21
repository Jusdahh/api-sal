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

app.get("/produtos", (req, res) => {
    try {
        client.query("SELECT * FROM produtos", (err, result) => {
            if (err) {
            return console.error("Erro ao executar a query de select produtos.", err);
            }
            res.send(result.rows);
            console.log("Chamou get produtos")
        });
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
            console.log("Chamou get logins")
        });
    } catch (error) {
        console.log(error);
    }
});

app.post("/login", (req, res) => {
  try{
    const { email, senha } = req.body;
    client.query("SELECT * FROM logins WHERE email = $1 AND senha = $2", [email, senha], (err, result) => {
      if (err) {
        return console.error("Erro ao executar a query de select logins.", err);
      }
      res.send(result.rows);
      console.log("Chamou post login")
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(config.port, () =>
  console.log("Servidor funcionando na porta " + config.port)
);

module.exports = app; 