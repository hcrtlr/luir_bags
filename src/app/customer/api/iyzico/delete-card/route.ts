import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cardToken, cardUserKey } = body

    // iyzico entegrasyonu
    // iyzipay.card.delete({ cardToken, cardUserKey }, (err, result) => { ... })

    // GELISTIRME ORTAMI — MOCK RESPONSE
    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: "Kart silinemedi." }, { status: 500 })
  }
}