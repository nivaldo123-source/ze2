import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId é obrigatório" }, { status: 400 })
    }

    const apiSecret =
      process.env.VIPERPAY_SECRET ||
      "sk_5d064414c4eda7eba6dded2c21f47f156e0a70e9e0b2f7a83be60f69957a0e260ddef8eff7593891f6ff8f8d186f1d791d3dfd1e9ebb95ec02546f2c142643e3"

    console.log(`[v0] Checking payment status for transaction: ${transactionId}`)

    const response = await fetch(`https://api.viperpay.org/v1/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "api-secret": apiSecret,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.log(`[v0] ViperPay API error: ${response.status}`)
      return NextResponse.json(
        { error: `Erro ao consultar transação: ${response.status}` },
        { status: response.status },
      )
    }

    const transactionData = await response.json()
    console.log(`[v0] Transaction data:`, transactionData)

    let status: "waiting" | "paid" | "failed" = "waiting"

    if (transactionData.status === "AUTHORIZED") {
      status = "paid"
    } else if (
      transactionData.status === "FAILED" ||
      transactionData.status === "CHARGEBACK" ||
      transactionData.status === "IN_DISPUTE"
    ) {
      status = "failed"
    } else if (transactionData.status === "PENDING") {
      status = "waiting"
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error("[v0] Error checking payment status:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
