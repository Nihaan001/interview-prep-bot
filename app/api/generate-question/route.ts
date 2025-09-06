import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

const TECHNICAL_QUESTIONS = {
  "Software Engineer": [
    "Explain the difference between synchronous and asynchronous programming. When would you use each approach?",
    "How would you optimize a slow database query? Walk me through your debugging process.",
    "Design a system to handle 1 million concurrent users. What are the key considerations?",
    "Explain how you would implement a caching strategy for a web application.",
    "What are the trade-offs between microservices and monolithic architecture?",
  ],
  "Data Analyst": [
    "How would you handle missing data in a dataset before analysis?",
    "Explain the difference between correlation and causation with a real-world example.",
    "Walk me through how you would design an A/B test for a new feature.",
    "How do you determine if a dataset is normally distributed and why does it matter?",
    "Describe your approach to creating a dashboard for executive stakeholders.",
  ],
  "Product Manager": [
    "How would you prioritize features when you have limited development resources?",
    "Walk me through how you would launch a new product in a competitive market.",
    "How do you handle conflicting requirements from different stakeholders?",
    "Describe your process for gathering and analyzing user feedback.",
    "How would you measure the success of a new feature after launch?",
  ],
}

const BEHAVIORAL_QUESTIONS = [
  "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
  "Describe a situation where you had to meet a tight deadline. What was your approach?",
  "Give me an example of a time when you had to learn something completely new for a project.",
  "Tell me about a time when you disagreed with your manager's decision. How did you handle it?",
  "Describe a situation where you had to take initiative without being asked.",
]

export async function POST(request: NextRequest) {
  try {
    const { role, domain, mode, questionNumber } = await request.json()

    const hasApiKey = process.env.OPENAI_API_KEY

    if (!hasApiKey) {
      // Use fallback questions
      let question: string

      if (mode === "technical") {
        const questions =
          TECHNICAL_QUESTIONS[role as keyof typeof TECHNICAL_QUESTIONS] || TECHNICAL_QUESTIONS["Software Engineer"]
        question = questions[questionNumber % questions.length]
      } else {
        question = BEHAVIORAL_QUESTIONS[questionNumber % BEHAVIORAL_QUESTIONS.length]
      }

      return NextResponse.json({ question })
    }

    // Use OpenAI API if key is available
    const prompt =
      mode === "technical"
        ? `You are an expert technical interviewer. Generate a challenging but fair technical interview question for a ${role} position${domain ? ` specializing in ${domain}` : ""}. 

Question ${questionNumber + 1} of 5. Make it progressively more complex.

The question should:
- Test practical knowledge and problem-solving skills
- Be relevant to real-world scenarios
- Allow for multiple valid approaches
- Be appropriate for a ${role} role

Return only the question, no additional text.`
        : `You are an expert behavioral interviewer. Generate a behavioral interview question for a ${role} position${domain ? ` in ${domain}` : ""}.

Question ${questionNumber + 1} of 5. Focus on different competencies each time.

The question should:
- Use the STAR method framework
- Test leadership, teamwork, problem-solving, or conflict resolution
- Be relevant to a ${role} role
- Allow the candidate to showcase specific experiences

Return only the question, no additional text.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 200,
    })

    return NextResponse.json({ question: text.trim() })
  } catch (error) {
    console.error("Error generating question:", error)
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 })
  }
}
