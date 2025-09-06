import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

function generateFallbackEvaluation(question: string, answer: string, mode: string, role: string) {
  const answerLength = answer.length
  const hasExamples = answer.toLowerCase().includes("example") || answer.toLowerCase().includes("instance")
  const hasStructure = answer.includes(".") && answer.split(".").length > 2
  const mentionsTools = answer.toLowerCase().match(/(tool|framework|library|system|process|method)/g)

  let baseScore = 6
  const strengths = []
  const improvements = []

  // Analyze answer quality
  if (answerLength > 200) {
    baseScore += 1
    strengths.push("Provided detailed response")
  } else if (answerLength < 50) {
    baseScore -= 1
    improvements.push("Could provide more detailed explanation")
  }

  if (hasExamples) {
    baseScore += 1
    strengths.push("Used specific examples")
  } else {
    improvements.push("Consider adding concrete examples")
  }

  if (hasStructure) {
    strengths.push("Well-structured response")
  } else {
    improvements.push("Could organize response more clearly")
  }

  if (mode === "technical") {
    if (mentionsTools && mentionsTools.length > 0) {
      baseScore += 1
      strengths.push("Demonstrated technical knowledge")
    } else {
      improvements.push("Could mention relevant tools or technologies")
    }
  } else {
    // Behavioral interview
    const hasStar =
      answer.toLowerCase().includes("situation") ||
      answer.toLowerCase().includes("task") ||
      answer.toLowerCase().includes("action") ||
      answer.toLowerCase().includes("result")

    if (hasStar) {
      baseScore += 1
      strengths.push("Used structured approach (STAR method)")
    } else {
      improvements.push("Consider using STAR method (Situation, Task, Action, Result)")
    }
  }

  // Ensure we have at least 2 strengths and improvements
  if (strengths.length < 2) {
    strengths.push("Clear communication style")
  }
  if (strengths.length < 3) {
    strengths.push("Relevant to the question asked")
  }

  if (improvements.length < 2) {
    improvements.push("Could elaborate on key points")
  }

  const finalScore = Math.min(Math.max(baseScore, 1), 10)

  return {
    score: finalScore,
    feedback: {
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 2),
      clarity: Math.min(finalScore + Math.floor(Math.random() * 2), 10),
      correctness: Math.min(finalScore + Math.floor(Math.random() * 2), 10),
      completeness: Math.min(finalScore + Math.floor(Math.random() * 2), 10),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, answer, mode, role } = await request.json()

    const hasApiKey = process.env.OPENAI_API_KEY

    if (!hasApiKey) {
      const evaluation = generateFallbackEvaluation(question, answer, mode, role)
      return NextResponse.json(evaluation)
    }

    // Use OpenAI API if key is available
    const prompt =
      mode === "technical"
        ? `You are an expert technical interviewer evaluating a ${role}'s answer. 

Question: "${question}"
Answer: "${answer}"

Evaluate this answer based on:
1. Technical accuracy and correctness
2. Clarity of explanation and communication
3. Completeness of the solution
4. Problem-solving approach

Provide your evaluation in this exact JSON format:
{
  "score": [number from 1-10],
  "feedback": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2"],
    "clarity": [number from 1-10],
    "correctness": [number from 1-10], 
    "completeness": [number from 1-10]
  }
}

Be constructive but honest in your evaluation.`
        : `You are an expert behavioral interviewer evaluating a ${role}'s answer.

Question: "${question}"
Answer: "${answer}"

Evaluate this answer based on:
1. Use of STAR method (Situation, Task, Action, Result)
2. Specific examples and real-world relevance
3. Clarity of communication
4. Demonstration of relevant skills/competencies

Provide your evaluation in this exact JSON format:
{
  "score": [number from 1-10],
  "feedback": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2"],
    "clarity": [number from 1-10],
    "correctness": [number from 1-10],
    "completeness": [number from 1-10]
  }
}

Be constructive but honest in your evaluation.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 500,
    })

    // Parse the JSON response
    const evaluation = JSON.parse(text.trim())

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error("Error evaluating answer:", error)
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 })
  }
}
