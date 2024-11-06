import { Router } from "express";

export const router = Router();
router.get("/test",(req,res)=>{
    res.json({
        message:"testing"
    })
})
router.get("/element",(req,res)=>{
    res.json({
        message:"testing"
    })
})
router.get("/avatar",(req,res)=>{
    res.json({
        message:"testing"
    })
})