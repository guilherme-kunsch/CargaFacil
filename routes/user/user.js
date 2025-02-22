import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../server.js";


const router = Router();

router.post("/register", async (req, res) => {
  try {
    const userSchema = z
      .object({
        cpfCnpj: z.string().trim(),
        name: z.string().trim(),
        surname: z.string().trim(),
        email: z.string().email().trim(),
        phone: z.string().trim(),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters long")
          .trim(),
        clienteId: z.number().optional().nullable(),
        transportadoraId: z.number().optional().nullable(),
      })
      .refine(
        (data) => data.clienteId !== null || data.transportadoraId !== null,
        {
          message:
            "O usuário deve estar associado a um cliente (clienteId) ou transportadora (transportadoraId).",
          path: ["clienteId", "transportadoraId"],
        }
      )
      .refine((data) => !(data.clienteId && data.transportadoraId), {
        message:
          "O usuário não pode estar associado a ambos cliente e transportadora. Informe apenas um dos campos: clienteId ou transportadoraId.",
        path: ["clienteId", "transportadoraId"],
      });

    const parsedUser = userSchema.parse(req.body);

    const existingUser = await prisma.usuario.findUnique({
      where: {
        email: parsedUser.email,
      },
    });

    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(parsedUser.password, 10);
    const idUnicoHash = uuidv4();

    const newUser = await prisma.usuario.create({
      data: {
        cpfCnpj: parsedUser.cpfCnpj,
        nome: parsedUser.name,
        sobrenome: parsedUser.surname,
        email: parsedUser.email,
        telefone: parsedUser.phone,
        senha: hashedPassword,
        clienteId: parsedUser.clienteId,
        transportadoraId: parsedUser.transportadoraId,
        idUnicoHash,
      },
    });

    res.send({ success: true, user: newUser });
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

router.post("/login", async (req, res) => {
  try {
    const userSchema = z.object({
      email: z.string().email().trim(),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .trim(),
    });

    const loginUser = userSchema.parse(req.body);

    const searchUser = await prisma.usuario.findUnique({
      where: {
        email: loginUser.email,
      },
    });

    if (!searchUser) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(
      loginUser.password,
      searchUser.senha
    );
    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    return res.status(200).send({
      success: true,
      message: "Login successful",
      userId: searchUser.id,
    });
    
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "An unexpected error occurred" });
  }
});

export default router;
