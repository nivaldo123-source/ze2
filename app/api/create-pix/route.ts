import { type NextRequest, NextResponse } from "next/server"

const PREDEFINED_CUSTOMERS = [
  {
    name: "João Silva Santos",
    email: "joao.silva@email.com",
    phone: "+5511987654321",
    document: "73263052187", // Valid CPF: 732.630.521-87
  },
  {
    name: "Maria Oliveira Costa",
    email: "maria.oliveira@email.com",
    phone: "+5511976543210",
    document: "04960639105", // Valid CPF: 049.606.391-05
  },
  {
    name: "Carlos Eduardo Lima",
    email: "carlos.lima@email.com",
    phone: "+5511965432109",
    document: "05396880104", // Valid CPF: 053.968.801-04
  },
]

function getRandomCustomer() {
  const randomIndex = Math.floor(Math.random() * PREDEFINED_CUSTOMERS.length)
  return PREDEFINED_CUSTOMERS[randomIndex]
}

function validateUtmData(utmData: any) {
  const validKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
  const result: any = {}

  validKeys.forEach((key) => {
    result[key] = utmData[key] || "direct"
  })

  return result
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

function formatDateToUtmify(date: Date | null): string | null {
  if (!date) return null

  // Format: YYYY-MM-DD HH:MM:SS (UTC)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Request body received:", JSON.stringify(body, null, 2))

    const apiSecret =
      process.env.VIPERPAY_SECRET ||
      "sk_5d064414c4eda7eba6dded2c21f47f156e0a70e9e0b2f7a83be60f69957a0e260ddef8eff7593891f6ff8f8d186f1d791d3dfd1e9ebb95ec02546f2c142643e3"

    console.log("[API] Iniciando requisição PIX para ViperPay...")

    const selectedCustomer = getRandomCustomer()
    console.log("[v0] Cliente selecionado:", selectedCustomer.name)

    const amountInReais = normalizeToReais(body.amount)
    console.log("[ViperPay] raw amount:", body.amount, "type:", typeof body.amount)
    console.log("[ViperPay] amount (reais):", amountInReais)

    const timestamp = Date.now()

    const utmData = body.utmData || {}
    const validatedUtmData = validateUtmData(utmData)
    const { utm_source, utm_medium, utm_campaign, utm_content, utm_term } = validatedUtmData

    const utmParams = `utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}&utm_content=${utm_content}&utm_term=${utm_term}`
    const external_id = `transaction_${timestamp}?${utmParams}`

    console.log("[v0] UTM parameters:", { utm_source, utm_medium, utm_campaign, utm_content, utm_term })
    console.log("[v0] External ID with UTMs:", external_id)

    const transactionData = {
      external_id: external_id,
      total_amount: amountInReais,
      payment_method: "PIX",
      webhook_url: "https://privacyze.vercel.app/api/webhook/viperpay", // Updated webhook URL to use the new endpoint
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
        utm_source: utm_source,
        utm_medium: utm_medium,
        utm_campaign: utm_campaign,
        utm_content: utm_content,
        utm_term: utm_term,
      },
    }

    console.log("[v0] JSON final enviado para ViperPay:", JSON.stringify(transactionData, null, 2))

    const response = await fetch("https://api.viperpay.org/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-secret": apiSecret,
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
          error: `Erro da API ViperPay: ${response.status} - ${errorText}`,
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    console.log("[v0] Sucesso - Response completa:", JSON.stringify(result, null, 2))

    const utmifyData = {
      orderId: result.id || external_id,
      platform: "ViperPay",
      paymentMethod: "pix",
      status: "waiting_payment",
      createdAt: formatDateToUtmify(new Date()),
      approvedDate: formatDateToUtmify(null),
      refundedAt: formatDateToUtmify(null),
      customer: {
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        document: selectedCustomer.document,
        country: "BR",
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      },
      products: [
        {
          id: "plano1",
          name: "Assinatura Privacy",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: Math.round(amountInReais * 100),
        },
      ],
      trackingParameters: {
        src: utm_source, // Direct mapping
        sck: null,
        utm_source: utm_source,
        utm_campaign: utm_campaign,
        utm_medium: utm_medium,
        utm_content: utm_content,
        utm_term: utm_term,
      },
      commission: {
        totalPriceInCents: Math.round(amountInReais * 100),
        gatewayFeeInCents: 0,
        userCommissionInCents: Math.round(amountInReais * 100),
      },
      isTest: false,
      // Keep external_id as separate field
      externalId: external_id,
    }

    console.log("[UTMify] Dados que serão enviados:", JSON.stringify(utmifyData, null, 2))
    console.log("[UTMify] Token usado:", "Zq85DjN5QcQQOOz9gCE7nb3tobQMggL29Erf")

    fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": "Zq85DjN5QcQQOOz9gCE7nb3tobQMggL29Erf",
        Accept: "application/json",
      },
      body: JSON.stringify(utmifyData),
    })
      .then(async (utmifyResponse) => {
        console.log("[v0] Utmify response status:", utmifyResponse.status)
        if (!utmifyResponse.ok) {
          const errorText = await utmifyResponse.text()
          console.error("[v0] Utmify error response:", errorText)
        } else {
          const utmifyResult = await utmifyResponse.json()
          console.log("[v0] Utmify success:", utmifyResult)
        }
      })
      .catch((utmifyError) => {
        console.error("[v0] Utmify request failed:", utmifyError)
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Erro geral:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
