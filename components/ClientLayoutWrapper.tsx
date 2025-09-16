"use client"

import type React from "react"

import { useState } from "react"
import IntroFlow from "@/app/IntroFlow"

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const [showIntro, setShowIntro] = useState(true)

  const handleIntroComplete = () => {
    setShowIntro(false)
  }

  if (showIntro) {
    return <IntroFlow onComplete={handleIntroComplete} />
  }

  return <>{children}</>
}
