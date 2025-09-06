"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageCircle,
  Brain,
  Target,
  CheckCircle,
  Clock,
  Star,
  Code,
  BarChart3,
  Briefcase,
  Send,
  Bot,
  Download,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react"

interface InterviewSession {
  role: string
  domain: string
  mode: "technical" | "behavioral"
  questions: Array<{
    question: string
    answer: string
    score: number
    feedback: {
      strengths: string[]
      improvements: string[]
      clarity: number
      correctness: number
      completeness: number
    }
  }>
  currentQuestionIndex: number
  isActive: boolean
  startTime: Date
}

interface SummaryReport {
  overallScore: number
  strengths: string[]
  areasToImprove: string[]
  suggestedResources: string[]
  detailedScores: {
    clarity: number
    correctness: number
    completeness: number
    technicalAccuracy?: number
    realWorldExamples?: number
  }
}

export default function InterviewPrepClient() {
  const [currentStep, setCurrentStep] = useState<"setup" | "interview" | "summary">("setup")
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("")
  const [typingText, setTypingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const roles = [
    { id: "software-engineer", name: "Software Engineer", icon: Code },
    { id: "product-manager", name: "Product Manager", icon: Target },
    { id: "data-analyst", name: "Data Analyst", icon: BarChart3 },
    { id: "business-analyst", name: "Business Analyst", icon: Briefcase },
    { id: "frontend-developer", name: "Frontend Developer", icon: Code },
    { id: "backend-developer", name: "Backend Developer", icon: Code },
  ]

  const domains = [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Machine Learning",
    "Data Science",
    "System Design",
    "Product Strategy",
    "Business Intelligence",
    "DevOps",
    "Mobile Development",
  ]

  const typeText = (text: string, callback?: () => void) => {
    setIsTyping(true)
    setTypingText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setTypingText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        callback?.()
      }
    }, 30)
  }

  const generateQuestion = async (
    role: string,
    domain: string,
    mode: "technical" | "behavioral",
    questionNumber: number,
  ) => {
    setIsGeneratingQuestion(true)

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, domain, mode, questionNumber }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate question")
      }

      const data = await response.json()
      setIsGeneratingQuestion(false)
      return data.question
    } catch (error) {
      console.error("Error generating question:", error)
      setIsGeneratingQuestion(false)
      return `Tell me about a challenging ${mode} problem you've solved in your ${role} role.`
    }
  }

  const evaluateAnswer = async (question: string, answer: string, mode: "technical" | "behavioral", role: string) => {
    setIsEvaluating(true)

    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer, mode, role }),
      })

      if (!response.ok) {
        throw new Error("Failed to evaluate answer")
      }

      const evaluation = await response.json()
      setIsEvaluating(false)
      return evaluation
    } catch (error) {
      console.error("Error evaluating answer:", error)
      setIsEvaluating(false)

      const answerLength = answer.trim().split(" ").length
      const hasExamples = answer.toLowerCase().includes("example") || answer.toLowerCase().includes("instance")
      const hasNumbers = /\d/.test(answer)
      const hasStructure =
        mode === "behavioral" &&
        (answer.toLowerCase().includes("situation") ||
          answer.toLowerCase().includes("task") ||
          answer.toLowerCase().includes("action") ||
          answer.toLowerCase().includes("result"))

      // Generate dynamic strengths based on answer analysis
      const dynamicStrengths = []
      if (answerLength > 50) dynamicStrengths.push("Provided detailed response")
      if (hasExamples) dynamicStrengths.push("Used concrete examples")
      if (hasNumbers) dynamicStrengths.push("Included specific metrics or data")
      if (hasStructure) dynamicStrengths.push("Followed structured approach")
      if (answerLength > 20) dynamicStrengths.push("Clear communication style")

      // Fallback strengths if none detected
      if (dynamicStrengths.length === 0) {
        dynamicStrengths.push("Attempted to answer the question", "Shows understanding of the topic")
      }

      // Generate dynamic improvements based on what's missing
      const dynamicImprovements = []
      if (answerLength < 30) dynamicImprovements.push("Could provide more detailed explanation")
      if (!hasExamples) dynamicImprovements.push("Consider adding specific examples")
      if (mode === "behavioral" && !hasStructure)
        dynamicImprovements.push("Try using the STAR method (Situation, Task, Action, Result)")
      if (mode === "technical" && !hasNumbers) dynamicImprovements.push("Include specific technical details or metrics")
      if (answerLength < 50) dynamicImprovements.push("Expand on your thought process")

      // Fallback improvements if none detected
      if (dynamicImprovements.length === 0) {
        dynamicImprovements.push("Consider adding more context", "Could elaborate on key points")
      }

      // Dynamic scoring based on answer quality
      const baseScore = Math.min(Math.max(Math.floor(answerLength / 10), 4), 8)
      const bonusPoints = (hasExamples ? 1 : 0) + (hasStructure ? 1 : 0) + (hasNumbers ? 0.5 : 0)
      const finalScore = Math.min(baseScore + bonusPoints, 10)

      return {
        score: Math.round(finalScore * 10) / 10,
        feedback: {
          strengths: dynamicStrengths.slice(0, 3),
          improvements: dynamicImprovements.slice(0, 2),
          clarity: Math.min(baseScore + (answerLength > 30 ? 1 : 0), 10),
          correctness: Math.min(baseScore + (hasExamples ? 1 : 0), 10),
          completeness: Math.min(baseScore + (answerLength > 50 ? 1 : 0), 10),
        },
      }
    }
  }

  const generateSummaryReport = (session: InterviewSession): SummaryReport => {
    const scores = session.questions.map((q) => q.score)
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length

    const allStrengths = session.questions.flatMap((q) => q.feedback.strengths)
    const allImprovements = session.questions.flatMap((q) => q.feedback.improvements)

    // Count frequency of similar feedback to identify patterns
    const strengthCounts = allStrengths.reduce(
      (acc, strength) => {
        const key = strength.toLowerCase()
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const improvementCounts = allImprovements.reduce(
      (acc, improvement) => {
        const key = improvement.toLowerCase()
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Get top strengths and improvements
    const topStrengths = Object.entries(strengthCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([strength]) => strength.charAt(0).toUpperCase() + strength.slice(1))

    const topImprovements = Object.entries(improvementCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([improvement]) => improvement.charAt(0).toUpperCase() + improvement.slice(1))

    // Calculate detailed scores from actual feedback
    const clarityScores = session.questions.map((q) => q.feedback.clarity)
    const correctnessScores = session.questions.map((q) => q.feedback.correctness)
    const completenessScores = session.questions.map((q) => q.feedback.completeness)

    const avgClarity = clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length
    const avgCorrectness = correctnessScores.reduce((a, b) => a + b, 0) / correctnessScores.length
    const avgCompleteness = completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length

    // Dynamic resource suggestions based on performance
    const suggestedResources = []
    if (avgCorrectness < 7) {
      suggestedResources.push(
        session.mode === "technical" ? "LeetCode Practice Problems" : "Behavioral Interview Question Bank",
      )
    }
    if (avgClarity < 7) {
      suggestedResources.push("Communication Skills for Technical Professionals")
    }
    if (avgCompleteness < 7) {
      suggestedResources.push(
        session.mode === "technical" ? "System Design Interview by Alex Xu" : "STAR Method Interview Guide",
      )
    }

    // Default resources if performance is good
    if (suggestedResources.length === 0) {
      suggestedResources.push(
        "Cracking the Coding Interview",
        "Behavioral Interview Mastery",
        "Advanced Problem Solving Techniques",
      )
    }

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      strengths:
        topStrengths.length > 0
          ? topStrengths
          : [
              "Consistent performance across questions",
              "Good engagement with the interview process",
              "Willingness to tackle challenging questions",
            ],
      areasToImprove:
        topImprovements.length > 0
          ? topImprovements
          : [
              "Continue practicing to build confidence",
              "Focus on providing more detailed responses",
              "Work on structuring answers more effectively",
            ],
      suggestedResources,
      detailedScores: {
        clarity: Math.round(avgClarity * 10) / 10,
        correctness: Math.round(avgCorrectness * 10) / 10,
        completeness: Math.round(avgCompleteness * 10) / 10,
        technicalAccuracy: session.mode === "technical" ? Math.round(avgCorrectness * 10) / 10 : undefined,
        realWorldExamples: session.mode === "behavioral" ? Math.round(avgCompleteness * 10) / 10 : undefined,
      },
    }
  }

  const handleStartInterview = async (role: string, domain: string, mode: "technical" | "behavioral") => {
    const newSession: InterviewSession = {
      role,
      domain,
      mode,
      questions: [],
      currentQuestionIndex: 0,
      isActive: true,
      startTime: new Date(),
    }

    setSession(newSession)
    setCurrentStep("interview")

    const firstQuestion = await generateQuestion(role, domain, mode, 0)
    setSession((prev) =>
      prev
        ? {
            ...prev,
            questions: [
              {
                question: firstQuestion,
                answer: "",
                score: 0,
                feedback: {
                  strengths: [],
                  improvements: [],
                  clarity: 0,
                  correctness: 0,
                  completeness: 0,
                },
              },
            ],
          }
        : null,
    )
  }

  const handleSubmitAnswer = async () => {
    if (!session || !currentAnswer.trim()) return

    const currentQuestion = session.questions[session.currentQuestionIndex]
    const evaluation = await evaluateAnswer(currentQuestion.question, currentAnswer, session.mode, session.role)

    const updatedQuestions = [...session.questions]
    updatedQuestions[session.currentQuestionIndex] = {
      ...currentQuestion,
      answer: currentAnswer,
      score: evaluation.score,
      feedback: evaluation.feedback,
    }

    setSession((prev) =>
      prev
        ? {
            ...prev,
            questions: updatedQuestions,
          }
        : null,
    )

    setCurrentAnswer("")
  }

  const handleNextQuestion = async () => {
    if (!session) return

    const nextIndex = session.currentQuestionIndex + 1
    const maxQuestions = 5

    if (nextIndex >= maxQuestions) {
      const report = generateSummaryReport(session)
      setSummaryReport(report)
      setCurrentStep("summary")
      return
    }

    const nextQuestion = await generateQuestion(session.role, session.domain, session.mode, nextIndex)

    setSession((prev) =>
      prev
        ? {
            ...prev,
            currentQuestionIndex: nextIndex,
            questions: [
              ...prev.questions,
              {
                question: nextQuestion,
                answer: "",
                score: 0,
                feedback: {
                  strengths: [],
                  improvements: [],
                  clarity: 0,
                  correctness: 0,
                  completeness: 0,
                },
              },
            ],
          }
        : null,
    )
  }

  const handleRestart = () => {
    setCurrentStep("setup")
    setSession(null)
    setCurrentAnswer("")
    setSummaryReport(null)
    setSelectedRole("")
    setSelectedDomain("")
  }

  if (currentStep === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-accent/20 blur-3xl -z-10"></div>
            <div className="inline-flex items-center gap-3 mb-6 p-4 rounded-full bg-accent/10 border border-accent/20">
              <Bot className="h-8 w-8 text-accent animate-pulse" />
              <Sparkles className="h-6 w-6 text-accent animate-bounce" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4 text-balance bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
              Interview Preparation Bot
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              AI-powered interview practice with personalized feedback and real-time scoring
            </p>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 max-w-2xl mx-auto shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-card-foreground text-2xl flex items-center justify-center gap-2">
                <Zap className="h-6 w-6 text-accent" />
                Setup Your Interview Session
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Choose your target role and domain for personalized questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Target Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const IconComponent = role.icon
                    return (
                      <Button
                        key={role.id}
                        variant={selectedRole === role.name ? "default" : "outline"}
                        className={`h-auto p-4 justify-start transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                          selectedRole === role.name
                            ? "bg-accent text-accent-foreground shadow-lg ring-2 ring-accent/50"
                            : "hover:bg-accent/10 hover:border-accent/50"
                        }`}
                        onClick={() => setSelectedRole(role.name)}
                      >
                        <IconComponent
                          className={`h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110 ${
                            selectedRole === role.name ? "text-accent-foreground" : "text-accent"
                          }`}
                        />
                        <span className="text-sm font-medium">{role.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Domain (Optional)
                </label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger className="h-12 border-border/50 hover:border-accent/50 transition-colors duration-300 focus:ring-2 focus:ring-accent/20">
                    <SelectValue placeholder="Select a domain or leave blank for general questions" />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain} className="hover:bg-accent/10 focus:bg-accent/10">
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Interview Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex-col items-start bg-gradient-to-br from-card to-accent/5 hover:from-accent/10 hover:to-accent/20 border-border/50 hover:border-accent/50 transition-all duration-500 hover:scale-105 hover:shadow-xl group"
                    onClick={() =>
                      handleStartInterview(
                        selectedRole || "Software Engineer",
                        selectedDomain || "General",
                        "technical",
                      )
                    }
                    disabled={!selectedRole}
                  >
                    <Brain className="h-8 w-8 mb-3 text-accent group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-left">
                      <div className="font-semibold text-lg mb-1">Technical Interview</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Algorithm questions, coding, system design
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex-col items-start bg-gradient-to-br from-card to-accent/5 hover:from-accent/10 hover:to-accent/20 border-border/50 hover:border-accent/50 transition-all duration-500 hover:scale-105 hover:shadow-xl group"
                    onClick={() =>
                      handleStartInterview(
                        selectedRole || "Software Engineer",
                        selectedDomain || "General",
                        "behavioral",
                      )
                    }
                    disabled={!selectedRole}
                  >
                    <MessageCircle className="h-8 w-8 mb-3 text-accent group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-left">
                      <div className="font-semibold text-lg mb-1">Behavioral Interview</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        STAR-format questions, teamwork, leadership
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentStep === "interview" && session) {
    const currentQuestion = session.questions[session.currentQuestionIndex]
    const hasAnswered = currentQuestion?.answer && currentQuestion.score > 0
    const progress = ((session.currentQuestionIndex + 1) / 5) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleRestart}
              className="mb-4 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
            >
              ← Back to Setup
            </Button>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  {session.mode === "technical" ? (
                    <Brain className="h-8 w-8 text-accent animate-pulse" />
                  ) : (
                    <MessageCircle className="h-8 w-8 text-accent animate-pulse" />
                  )}
                  {session.mode === "technical" ? "Technical" : "Behavioral"} Interview
                </h1>
                <p className="text-muted-foreground text-lg">
                  {session.role} • {session.domain}
                </p>
              </div>
              <Badge variant="secondary" className="px-4 py-2 text-lg bg-accent/10 text-accent border-accent/20">
                Question {session.currentQuestionIndex + 1} of 5
              </Badge>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3 bg-muted/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/40 rounded-full opacity-50 animate-pulse"></div>
            </div>
          </div>

          {isGeneratingQuestion ? (
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
              <CardContent className="p-12 text-center">
                <div className="relative mb-6">
                  <Bot className="h-16 w-16 mx-auto text-accent animate-bounce" />
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <p className="text-2xl font-semibold text-card-foreground mb-2">Generating your next question...</p>
                <p className="text-lg text-muted-foreground">Tailoring question based on your role and experience</p>
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-accent rounded-full animate-bounce"></div>
                    <div
                      className="w-3 h-3 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-3 text-xl">
                    <Bot className="h-6 w-6 text-accent animate-pulse" />
                    Interview Question
                    <Sparkles className="h-5 w-5 text-accent animate-spin" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-gradient-to-r from-muted/50 to-accent/5 rounded-xl mb-6 border border-border/30">
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                      {currentQuestion?.question}
                    </p>
                  </div>

                  {!hasAnswered ? (
                    <div className="space-y-6">
                      <Textarea
                        placeholder={
                          session.mode === "behavioral"
                            ? "Structure your response using the STAR method (Situation, Task, Action, Result)..."
                            : "Explain your approach step by step, including your thought process..."
                        }
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="min-h-[200px] border-border/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all duration-300 text-lg leading-relaxed"
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-5 w-5 animate-pulse" />
                          <span className="text-lg">Take your time to think through your answer</span>
                        </div>
                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={!currentAnswer.trim() || isEvaluating}
                          className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isEvaluating ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 mr-3" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-muted/30 to-accent/5 rounded-xl border border-border/30">
                        <p className="text-sm text-muted-foreground mb-3 font-medium">Your Answer:</p>
                        <p className="text-card-foreground leading-relaxed text-lg">{currentQuestion.answer}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50 dark:border-green-800/30">
                          <CardHeader>
                            <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2 text-lg">
                              <CheckCircle className="h-6 w-6 animate-pulse" />
                              Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {currentQuestion.feedback.strengths.map((strength, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3 animate-fade-in"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-green-700 dark:text-green-300 leading-relaxed">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                          <CardHeader>
                            <CardTitle className="text-accent flex items-center gap-2 text-lg">
                              <Target className="h-6 w-6 animate-pulse" />
                              Areas for Improvement
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {currentQuestion.feedback.improvements.map((improvement, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3 animate-fade-in"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  <Target className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                                  <span className="text-accent leading-relaxed">{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex justify-between items-center pt-6 border-t border-border/50">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50/50 to-yellow-100/30 dark:from-yellow-950/20 dark:to-yellow-900/10 rounded-lg border border-yellow-200/50 dark:border-yellow-800/30">
                            <Star className="h-6 w-6 text-yellow-500 animate-pulse" />
                            <span className="font-bold text-xl text-yellow-700 dark:text-yellow-300">
                              Score: {currentQuestion.score}/10
                            </span>
                          </div>
                          <div className="text-muted-foreground space-y-1">
                            <div className="text-sm">Clarity: {currentQuestion.feedback.clarity}/10</div>
                            <div className="text-sm">Correctness: {currentQuestion.feedback.correctness}/10</div>
                            <div className="text-sm">Completeness: {currentQuestion.feedback.completeness}/10</div>
                          </div>
                        </div>
                        <Button
                          onClick={handleNextQuestion}
                          className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        >
                          {session.currentQuestionIndex < 4 ? "Next Question →" : "Complete Interview ✓"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentStep === "summary" && summaryReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-accent/20 blur-3xl -z-10"></div>
            <div className="inline-flex items-center gap-3 mb-6 p-4 rounded-full bg-gradient-to-r from-accent/10 to-accent/20 border border-accent/30">
              <CheckCircle className="h-8 w-8 text-green-500 animate-bounce" />
              <Sparkles className="h-6 w-6 text-accent animate-spin" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
              Interview Complete! 🎉
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Here's your comprehensive performance report
            </p>
          </div>

          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-card/80 to-accent/5 backdrop-blur-sm border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <CardContent className="p-12 text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 mb-6 shadow-2xl">
                  <span className="text-4xl font-bold text-accent">{summaryReport.overallScore}</span>
                  <span className="text-2xl text-muted-foreground">/10</span>
                  <div className="absolute inset-0 bg-accent/10 rounded-full animate-pulse"></div>
                </div>
                <h2 className="text-3xl font-bold text-card-foreground mb-4">Overall Performance</h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {summaryReport.overallScore >= 8.5
                    ? "🌟 Excellent performance! You're well-prepared for your interviews."
                    : summaryReport.overallScore >= 7.5
                      ? "👍 Good performance with room for improvement."
                      : "💪 Keep practicing to improve your interview skills."}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-card-foreground text-2xl flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-accent" />
                  Detailed Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-accent/20">
                    <div className="text-3xl font-bold text-accent mb-2">{summaryReport.detailedScores.clarity}</div>
                    <div className="text-lg font-medium text-muted-foreground">Clarity</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-accent/20">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {summaryReport.detailedScores.correctness}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground">Correctness</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-accent/20">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {summaryReport.detailedScores.completeness}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground">Completeness</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50 dark:border-green-800/30 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2 text-xl">
                    <CheckCircle className="h-6 w-6 animate-pulse" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {summaryReport.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-green-700 dark:text-green-300 leading-relaxed text-lg">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-accent flex items-center gap-2 text-xl">
                    <Target className="h-6 w-6 animate-pulse" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {summaryReport.areasToImprove.map((area, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <Target className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-accent leading-relaxed text-lg">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-card-foreground text-xl flex items-center gap-2">
                  <Brain className="h-6 w-6 text-accent" />
                  Suggested Resources
                </CardTitle>
                <CardDescription className="text-muted-foreground text-lg">
                  Recommended materials to help you improve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {summaryReport.suggestedResources.map((resource, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-muted/30 to-accent/5 rounded-lg border border-border/30 hover:border-accent/30 transition-all duration-300"
                    >
                      <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                      <span className="text-muted-foreground text-lg">{resource}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-6">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/10 hover:border-accent/50 px-8 py-3 text-lg transition-all duration-300 hover:scale-105"
              >
                <Download className="h-5 w-5" />
                Export Report
              </Button>
              <Button
                onClick={handleRestart}
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start New Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
