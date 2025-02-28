import express from "express";
import user from "./routes/user/user.js";
import client from "./routes/client/client.js"
import carrier from "./routes/carrier/carrier.js"
import uploadTable from "./routes/table/uploadTable.js"
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();
export { prisma };

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/user", user);
app.use("/client", client);
app.use("/carrier", carrier)
app.use("/table", uploadTable)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
