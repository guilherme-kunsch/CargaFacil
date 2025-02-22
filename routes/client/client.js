import { z } from "zod";
import { prisma } from "../../server.js";
import { Router } from "express";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const schema = z.object({
      cnpj: z.string().trim(),
      razaoSocial: z.string().trim(),
      nomeFantasia: z.string().trim(),
      inscricaoEstadual: z.string().trim(),
      telefone: z.string().trim(),
      email: z.string().email().trim(),
      endereco: z.object({
        cep: z.string().trim(),
        rua: z.string().trim(),
        numero: z.string().trim(),
        complemento: z.string().trim(),
        bairro: z.string().trim(),
        cidade: z.string().trim(),
        estado: z.string().trim(),
      }),
    });
    

    const parsedClient = schema.parse(req.body);

    console.log("Dados recebidos:", parsedClient);


    const checkClient = await prisma.cliente.findUnique({
      where: {
        cnpj: parsedClient.cnpj,
      },
    });

    if (checkClient) {
      return res.status(400).send({
        success: false,
        message: "User with this CNPJ already exists",
      });
    }

    const newClient = await prisma.cliente.create({
      data: {
        cnpj: parsedClient.cnpj,
        razaoSocial: parsedClient.razaoSocial,
        nomeFantasia: parsedClient.nomeFantasia,
        inscricaoEstadual: parsedClient.inscricaoEstadual,
        telefone: parsedClient.telefone,
        email: parsedClient.email,
        endereco: {
          create: {
            cep: parsedClient.endereco.cep,
            rua: parsedClient.endereco.rua,
            numero: parsedClient.endereco.numero,
            complemento: parsedClient.endereco.complemento,
            bairro: parsedClient.endereco.bairro,
            cidade: parsedClient.endereco.cidade,
            estado: parsedClient.endereco.estado,
          },
        },
      },
      include: {
        endereco: true,
      },
    });

    res.status(200).send({
      success: true,
      client: newClient,
    });
  } catch (err) {
    console.error("Erro no registro de cliente:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).send({
        success: false,
        errors: err.errors,
      });
    }

    res.status(500).send({
      success: false,
      error: err,
    });
  }
});

export default router;