"use client"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    category: "Sipariş",
    items: [
      { q: "Siparişimi nasıl takip edebilirim?", a: "Hesabınıza giriş yaptıktan sonra 'Siparişlerim' bölümünden tüm siparişlerinizi ve durumlarını görüntüleyebilirsiniz. Ayrıca kargo onayı sonrası e-posta ile takip numarası iletilmektedir." },
      { q: "Siparişimi iptal edebilir miyim?", a: "Siparişiniz 'Hazırlanıyor' aşamasındayken iptal talebinde bulunabilirsiniz. Kargoya verildikten sonra iptal mümkün değildir, iade sürecini başlatmanız gerekir." },
      { q: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", a: "Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Kredi kartı ödemelerinde taksit imkanı sunulmaktadır." },
      { q: "Faturamı nasıl alabilirim?", a: "Faturanız, siparişiniz onaylandıktan sonra e-posta adresinize dijital olarak gönderilmektedir." },
    ]
  },
  {
    category: "Kargo & Teslimat",
    items: [
      { q: "Kargo ücreti ne kadar?", a: "500 TL ve üzeri siparişlerde kargo ücretsizdir. 500 TL altı siparişlerde kargo ücreti 129 TL'dir." },
      { q: "Teslimat ne kadar sürer?", a: "Siparişiniz onaylandıktan sonra 1-3 iş günü içinde teslim edilmektedir. Hafta sonu ve tatil günleri bu süreye dahil değildir." },
      { q: "Yurt dışına gönderim yapıyor musunuz?", a: "Şu an için yalnızca Türkiye geneli teslimat yapmaktayız. Yurt dışı teslimat için yakında hizmet vereceğiz." },
      { q: "Kapıda ödeme var mı?", a: "Şu an için kapıda ödeme seçeneği sunulmamaktadır." },
    ]
  },
  {
    category: "İade & Değişim",
    items: [
      { q: "İade süresi ne kadar?", a: "Teslim tarihinden itibaren 30 gün içinde iade talebinde bulunabilirsiniz." },
      { q: "Hangi ürünler iade edilemez?", a: "Kullanılmış, etiketi sökülmüş veya orijinal ambalajı bozulmuş ürünler iade kabul edilmemektedir." },
      { q: "İade kargo ücreti kime ait?", a: "Normal iadelerde kargo ücreti müşteriye aittir. Hatalı veya hasarlı ürün gönderimlerinde kargo ücreti tarafımızca karşılanır." },
      { q: "Paramı ne zaman geri alırım?", a: "İade onaylandıktan ve ürün bize ulaştıktan sonra 5-10 iş günü içinde ödemeniz iade edilir." },
    ]
  },
  {
    category: "Ürünler",
    items: [
      { q: "Ürünler orijinal mi?", a: "Evet, tüm Luir ürünleri markamıza ait orijinal ve el işçiliği ile üretilmiş ürünlerdir." },
      { q: "Ürün stoğu tükendiyse ne yapmalıyım?", a: "Ürün sayfasında 'Stok Bildirimi' butonuna tıklayarak stoğa girdiğinde bildirim alabilirsiniz." },
      { q: "Ürünlerin garantisi var mı?", a: "Tüm deri ürünlerimiz 1 yıl üretim hatası garantisi kapsamındadır. Kullanım kaynaklı hasarlar garanti dışındadır." },
    ]
  },
]

export default function SSSPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Sıkça Sorulan Sorular
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem" }}>Merak ettiklerinizin cevaplarını burada bulabilirsiniz.</p>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 3rem" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "3rem" }}>
          {faqs.map((cat, ci) => (
            <div key={ci}>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.6rem", fontWeight: 300, marginBottom: "1rem", color: "#0A0A0A" }}>
                {cat.category}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "0" }}>
                {cat.items.map((item, qi) => {
                  const key = ci + "-" + qi
                  const isOpen = openIndex === key
                  return (
                    <div key={qi} style={{ borderBottom: "0.5px solid #efefef" }}>
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : key)}
                        style={{ width: "100%", padding: "1.2rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const, gap: "1rem" }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 400, color: "#0A0A0A" }}>{item.q}</span>
                        {isOpen ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
                      </button>
                      {isOpen && (
                        <div style={{ paddingBottom: "1.2rem", fontSize: "13px", color: "#666", lineHeight: 1.8 }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem", background: "#F8F8F8", padding: "2rem", display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300 }}>Sorunuzu bulamadınız mı?</div>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7 }}>
            <a href="mailto:destek@luir.com" style={{ color: "#0A0A0A", fontWeight: 500 }}>destek@luir.com</a> adresine yazabilir veya aşağıdaki iletişim sayfamızı ziyaret edebilirsiniz.
          </p>
          <Link href="/customer/iletisim" style={{ marginTop: "0.5rem", background: "#0A0A0A", color: "#fff", padding: "10px 20px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", alignSelf: "flex-start", fontFamily: "var(--font-dm-sans)" }}>
            İletişime Geç
          </Link>
        </div>
      </div>
    </main>
  )
}