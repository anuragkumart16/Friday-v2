import { createGroq } from '@ai-sdk/groq';
import { generateText, stepCountIs } from "ai";
import { systemPrompt, DynamicBehaviourProfile } from "./prompts";
import { googleTasksTools } from "./tools";


const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY
});

const model = groq('llama-3.1-8b-instant')


async function callLLM(prompt: string, user: string) {
    const response = await generateText({
        model,
        temperature: 0.2,
        messages: [
            { role: 'system', content: DynamicBehaviourProfile(user) },
            { role: "user", content: prompt }
        ],
        system: systemPrompt,
        tools: googleTasksTools,
        toolChoice: 'auto',
        stopWhen: stepCountIs(5),
    })
    return response.text
}

export default callLLM
