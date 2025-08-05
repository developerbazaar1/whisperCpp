import express from  "express";
import { transcribeController } from "./controller/transcribe.controller.js";

const app = express();

app.use(express.json());

app.post("/transcribe", transcribeController)

app.listen(()=>{
   console.log("Server is running on localhost:3000")
},3000)
