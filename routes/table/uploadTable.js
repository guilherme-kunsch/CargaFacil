import { Router } from "express";
import csv from "csv-parser";
import fs from "fs";
import multer from "multer";
import { prisma } from "../../server.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não encontrado" });
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      if (row["Código"] && row["Descrição"] && row["Cnpj"]) {
        results.push({
          codigo: parseInt(row["Código"], 10),
          descricao: row["Descrição"],
          cnpj: row["Cnpj"],
        });
      }
    })
    .on("end", async () => {
      try {
        const transportadorasMap = new Map();

        for (const item of results) {
          if (!transportadorasMap.has(item.cnpj)) {
            const transportadora = await prisma.transportadora.findUnique({
              where: { cnpj: item.cnpj },
            });

            if (transportadora) {
              transportadorasMap.set(item.cnpj, transportadora.id);
            }
          }
        }

        const categorias = results
          .map((item) => {
            const transportadoraId = transportadorasMap.get(item.cnpj);
            return transportadoraId
              ? { codigo: item.codigo, descricao: item.descricao, transportadoraId }
              : null;
          })
          .filter((item) => item !== null);


        if (categorias.length > 0) {
          await prisma.categoria.createMany({
            data: categorias,
            skipDuplicates: true,
          });

          console.log("Dados inseridos com sucesso!");
          res.status(200).json({ message: "Planilha processada com sucesso!" });
        } else {
          console.warn("Nenhuma categoria válida para inserir!");
          res.status(400).json({ error: "Nenhuma transportadora correspondente encontrada" });
        }
      } catch (error) {
        console.error("Erro ao inserir no banco:", error);
        res.status(500).json({ error: "Erro ao inserir no banco" });
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Erro ao remover arquivo:", err);
        });
      }
    })
    .on("error", (error) => {
      console.error("Erro ao ler CSV:", error);
      res.status(500).json({ error: "Erro ao ler o arquivo CSV" });
    });
});

export default router;
