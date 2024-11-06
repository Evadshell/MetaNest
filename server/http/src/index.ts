import express from "express";
import { router } from "./routes/v1";
const app = express();
app.use("/api/v1", router); //it means like /api/v1 will be handled by riuter then exmapke /api/v1//singin
app.listen(5000)