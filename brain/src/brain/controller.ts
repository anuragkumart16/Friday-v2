import { Request, Response } from "express";
import callLLM from "./ai_sdk_service";
import ApiResponse from "../utils/response.util";
import { masterName } from "../constants";
import { logger } from "../logger/logger";


const brainControllerForGuest = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body
        const response = await callLLM(prompt,"guest")
        ApiResponse(res, 200, 'Response from friday suceeded!', {
            response
        })
    } catch (error: any) {
        logger.error(`Guest brain error: ${error.message}`)
        ApiResponse(res, 500, 'Failed to get response from Friday', {
            error: error.message
        })
    }
}

const brainControllerForMasterUser = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body
        const response = await callLLM(prompt,masterName)
        ApiResponse(res, 200, 'Response from friday suceeded!', {
            response
        })
    } catch (error: any) {
        logger.error(`Master brain error: ${error.message}`)
        ApiResponse(res, 500, 'Failed to get response from Friday', {
            error: error.message
        })
    }
}

export { brainControllerForGuest,brainControllerForMasterUser }