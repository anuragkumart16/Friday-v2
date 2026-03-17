import { createGroq } from '@ai-sdk/groq';
import { generateText } from "ai";
import { systemPrompt } from "./prompts";

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY
});

const model = groq('llama-3.1-8b-instant')

async function callLLM(prompt: string) {
    const response = await generateText({
        model,
        prompt,
        system: systemPrompt
    })
    return response.text
}

export default callLLM
