import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
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
      const errorText = await response.text()
      console.log(`[v0] Error checking payment status: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: `Erro ao verificar status: ${response.status}` }, { status: response.status })
    }

    const result = await response.json()
    console.log(`[v0] Payment status response:`, JSON.stringify(result, null, 2))

    // Check if payment is completed (status might be 'paid', 'completed', etc.)
    const isPaid = result.status === "paid" || result.status === "completed" || result.status === "approved"

    return NextResponse.json({
      status: result.status,
      isPaid,
      transaction: result,
    })
  } catch (error) {
    console.error("[v0] Error checking payment status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
