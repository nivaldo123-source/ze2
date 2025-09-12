"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface IntroFlowProps {
  onComplete: () => void
}

export default function IntroFlow({ onComplete }: IntroFlowProps) {
  const [stage, setStage] = useState<"splash" | "static" | "modal">("splash")

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setStage("static")
    }, 1500)

    const modalTimer = setTimeout(() => {
      setStage("modal")
    }, 2500)

    return () => {
      clearTimeout(splashTimer)
      clearTimeout(modalTimer)
    }
  }, [])

  const handleAccessClick = () => {
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50">
      {stage === "splash" && (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <img
            src="/img1f.png"
            alt="Instagram Logo"
            className="w-auto h-auto max-w-[280px] max-h-[280px] object-contain"
          />
        </div>
      )}

      {/* Static background image - img2f.png */}
      {(stage === "static" || stage === "modal") && (
        <div className="w-full h-full flex items-center justify-center bg-black sm:p-4">
          <img
            src="/img2f.png"
            alt="Zé Felipe Profile"
            className="w-full h-full sm:max-w-sm sm:max-h-[90vh] object-cover sm:object-contain sm:rounded-lg sm:border-2 sm:border-white/20 sm:shadow-2xl"
          />
        </div>
      )}

      {/* Modal overlay */}
      {stage === "modal" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl p-5 md:p-6 max-w-xs w-full animate-in zoom-in-95 duration-180">
            {/* Blue accent bar */}
            <div className="absolute -left-1 top-12 h-28 w-2 rounded-full bg-[#0095F6]"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Image src="/logo1f.png" alt="Privacy Logo" width={28} height={28} className="rounded" />
                <span className="text-white font-semibold">Privacy</span>
              </div>
              <span className="text-zinc-400 text-xs">Publicidade</span>
            </div>

            {/* Main content */}
            <div className="max-h-[60vh] overflow-y-auto">
              <h2 className="text-white font-bold mb-4 leading-tight">
                🔒 Quer acesso exclusivo ao conteúdo privado do Zé Felipe?
                <br />
                <br />
                Sim? Então participe do convite especial para fãs e desbloqueie agora o acesso antecipado à página
                oficial!
              </h2>

              <div className="text-zinc-300 text-sm leading-relaxed mb-6 space-y-2">
                <p>Corra! Esse acesso está sendo liberado por tempo limitado…</p>
                <p>Clique no botão abaixo e escolha seu plano para entrar:</p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleAccessClick}
              className="w-full bg-[#0095F6] hover:bg-[#0083D4] active:bg-[#0071B8] text-white font-semibold py-3 rounded-xl shadow-lg transition-colors"
            >
              Quero Acessar Agora
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
