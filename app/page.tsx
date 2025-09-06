import { Suspense } from "react"
import InterviewPrepClient from "@/components/interview-prep-client"

export default function InterviewPrepBot() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <InterviewPrepClient />
    </Suspense>
  )
}
