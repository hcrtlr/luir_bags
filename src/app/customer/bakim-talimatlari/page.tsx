import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BakimTalimatlariPage() {
  const sections = [
    {
      material: "Gerçek Deri",
      icon: "🟤",
      tips: [
        "Nemli bir bezle hafifçe silerek temizleyin. Aşındırıcı maddeler kullanmayın.",
        "Leke oluştuğunda hemen müdahale edin; kurumadan önce temizlemek daha kolaydır.",
        "2-3 ayda bir kaliteli deri bakım kremi veya balmumu uygulayın.",
        "Doğrudan güneş ışığından ve ısı kaynaklarından uzak tutun.",
        "Uzun süre kullanılmayacaksa içine kağıt doldurun, şeklini korusun.",
        "Islak veya nemli ortamda bırakmayın; ıslandıysa doğal ortamda kurutun.",
      ]
    },
    {
      material: "Vegan Deri & Suni Deri",
      icon: "⚫",
      tips: [
        "Hafif nemli bezle silin, deterjan kullanmaktan kaçının.",
        "Solvent bazlı temizleyiciler yüzeye zarar verebilir.",
        "Serin ve kuru ortamda saklayın.",
        "Katlanarak depolamayın, kırışıklık oluşabilir.",
      ]
    },
    {
      material: "Naylon & Polyester",
      icon: "🔵",
      tips: [
        "Islak sünger veya bezle silin.",
        "Gerektiğinde hafif sabunlu suyla yıkayabilirsiniz.",
        "Makine yıkaması önerilmez.",
        "Sıkıştırılmadan serin ve kuru yerde saklayın.",
      ]
    },
    {
      material: "Kanvas & Kumaş",
      icon: "🟡",
      tips: [
        "Lekeyi soğuk suyla ve hafif sabunla silin.",
        "Doğrudan yıkama makinasına koymayın.",
        "Güneşte değil, gölgede kurutun.",
        "Depolamadan önce tamamen kuruduğundan emin olun.",
      ]
    },
    {
      material: "Metal Aksamlar & Fermuarlar",
      icon: "⚪",
      tips: [
        "Kuru bezle düzenli olarak silin.",
        "Paslanmayı önlemek için nemden uzak tutun.",
        "Fermuarlar sıkışıyorsa mum veya grafit sürün.",
        "Sert kimyasallar metal yüzeye zarar verir.",
      ]
    },
  ]

  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>

      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Bakım Talimatları
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem", lineHeight: 1.8 }}>
            Luir ürünlerinizin ömrünü uzatmak için malzemeye özel bakım önerilerimiz.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 3rem" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "2.5rem" }}>
          {sections.map((s, i) => (
            <div key={i} style={{ border: "0.5px solid #efefef" }}>
              <div style={{ padding: "1.2rem 1.5rem", background: "#FAFAFA", borderBottom: "0.5px solid #efefef", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300 }}>{s.material}</h2>
              </div>
              <div style={{ padding: "1.2rem 1.5rem" }}>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                  {s.tips.map((tip, ti) => (
                    <li key={ti} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "#555", lineHeight: 1.7 }}>
                      <span style={{ width: "5px", height: "5px", background: "#0A0A0A", borderRadius: "50%", flexShrink: 0, marginTop: "8px" }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div style={{ background: "#F8F8F8", padding: "2rem", borderLeft: "3px solid #0A0A0A" }}>
            <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.8 }}>
              Özel lekeler veya hasarlar için profesyonel deri bakım servislerine başvurmanızı öneririz.
              Ürününüzle ilgili sorularınız için <strong>destek@luir.com</strong> adresine yazabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}