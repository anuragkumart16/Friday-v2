import { Request, Response } from "express";
import callLLM from "./ai_sdk_service";
import ApiResponse from "../utils/response.util";


const brainController = async (req: Request, res: Response) => {
    const { prompt } = req.body
    const response = await callLLM(prompt)
    ApiResponse(res, 200, 'Response from friday suceeded!', {
        response
    })
}

export default brainController