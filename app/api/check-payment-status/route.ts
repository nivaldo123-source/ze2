import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId é obrigatório" }, { status: 400 })
    }

    const clientKey = process.env.SUNIZE_KEY || "ck_c9fb71cf7a95dbe44cf5aeacb39e599f"
    const clientSecret = process.env.SUNIZE_SECRET || "cs_00ca44a3a269c0b6c42cdb75998a7021"

    console.log(`[v0] Checking payment status for transaction: ${transactionId}`)

    const response = await fetch(`https://api.sunize.com.br/v1/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "x-api-key": clientKey,
        "x-api-secret": clientSecret,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.log(`[v0] Sunize API error: ${response.status}`)
      return NextResponse.json(
        { error: `Erro ao consultar transação: ${response.status}` },
        { status: response.status },
      )
    }

    const transactionData = await response.json()
    console.log(`[v0] Transaction data:`, transactionData)

    // Map Sunize status to our simplified status
    let status: "waiting" | "paid" | "failed" = "waiting"

    if (transactionData.status === "paid" || transactionData.status === "approved") {
      status = "paid"
    } else if (transactionData.status === "failed" || transactionData.status === "cancelled") {
      status = "failed"
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error("[v0] Error checking payment status:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
