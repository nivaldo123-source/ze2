import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[Webhook] Payload recebido:", body)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[Webhook] Erro ao processar webhook:", error)
    // Even on error, return 200 to acknowledge receipt
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
