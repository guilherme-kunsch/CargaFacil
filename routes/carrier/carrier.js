import { z } from "zod";
import { Router } from "express";
import { prisma } from "../../server.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const schema = z.object({
      cnpj: z.string().trim(),
      razaoSocial: z.string().trim(),
      nomeFantasia: z.string().trim(),
      inscricaoEstadual: z.string().trim(), 
      telefone: z.string().trim(),
      email: z.string().trim(),
      metodosPagamento: z.string().trim().optional(),
      endereco: z.object({
        rua: z.string().trim(), 
        numero: z.string().trim(),
        complemento: z.string().trim(),
        bairro: z.string().trim(),
        cidade: z.string().trim(),
        estado: z.string().trim(),
        cep: z.string().trim(),
        pais: z.string().trim(),
      }),
    });

    const parsedCarrier = schema.parse(req.body);

    const checkCarrier = await prisma.transportadora.findUnique({
      where: {
        cnpj: parsedCarrier.cnpj,
      },
    });

    if (checkCarrier) {
      return res.status(400).send({
        success: false,
        message: "User with this cnpj already exists",
      });
    }

    const newCarrier = await prisma.transportadora.create({
      data: {
        cnpj: parsedCarrier.cnpj,
        razaoSocial: parsedCarrier.razaoSocial,
        nomeFantasia: parsedCarrier.nomeFantasia,
        inscricaoEstadual: parsedCarrier.inscricaoEstadual,
        telefone: parsedCarrier.telefone,
        email: parsedCarrier.email,
        metodosPagamento: parsedCarrier.metodosPagamento,
        endereco: {
          create: {
            cep: parsedCarrier.endereco.cep,
            numero: parsedCarrier.endereco.numero,
            complemento: parsedCarrier.endereco.complemento,
            bairro: parsedCarrier.endereco.bairro,
            cidade: parsedCarrier.endereco.cidade,
            estado: parsedCarrier.endereco.estado,
          },
        },
      },
      include: {
        endereco: true,
      },
    });

    res.status(200).send({
      sucess: true,
      carrier: newCarrier,
    });
  } catch (err) {
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