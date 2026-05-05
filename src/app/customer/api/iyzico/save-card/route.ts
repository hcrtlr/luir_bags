import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cardHolderName, cardNumber, expireMonth, expireYear, cvc, userId } = body

    // iyzico entegrasyonu
    // npm install iyzipay
    // const Iyzipay = require("iyzipay")
    // const iyzipay = new Iyzipay({
    //   apiKey: process.env.IYZICO_API_KEY,
    //   secretKey: process.env.IYZICO_SECRET_KEY,
    //   uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    // })

    // const request = {
    //   locale: "tr",
    //   conversationId: userId,
    //   card: {
    //     cardHolderName,
    //     cardNumber,
    //     expireMonth,
    //     expireYear,
    //     cvc,
    //   },
    // }

    // iyzipay.card.create(request, (err, result) => {
    //   if (result.status === "success") {
    //     return NextResponse.json({
    //       cardToken: result.cardToken,
    //       cardUserKey: result.cardUserKey,
    //     })
    //   }
    // })

    // GELISTIRME ORTAMI — MOCK RESPONSE
    return NextResponse.json({
      cardToken: "mock_token_" + Date.now(),
      cardUserKey: "mock_user_key_" + userId,
    })

  } catch (error) {
    return NextResponse.json({ error: "Kart eklenemedi." }, { status: 500 })
  }
}