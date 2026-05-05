import Link from "next/link"
import { ArrowLeft, MapPin, Clock, ChevronRight } from "lucide-react"

const positions = [
  { title: "Kıdemli Frontend Geliştirici", dept: "Teknoloji", location: "İstanbul (Hibrit)", type: "Tam Zamanlı", desc: "Next.js ve React ile kullanıcı deneyimini şekillendirecek deneyimli geliştirici arıyoruz." },
  { title: "Ürün Tasarımcısı", dept: "Tasarım", location: "İstanbul", type: "Tam Zamanlı", desc: "Luir koleksiyonunu genişletmek için deri aksesuar tasarım deneyimine sahip yaratıcı bir tasarımcı." },
  { title: "Müşteri Deneyimi Uzmanı", dept: "Müşteri Hizmetleri", location: "Uzaktan", type: "Tam Zamanlı", desc: "Müşteri memnuniyetini ön planda tutan, çözüm odaklı ve iletişim becerileri güçlü bir uzman." },
  { title: "Sosyal Medya Editörü", dept: "Pazarlama", location: "İstanbul (Hibrit)", type: "Yarı Zamanlı", desc: "Luir'in dijital sesini şekillendirecek yaratıcı içerik üreticisi." },
]

export default function KariyerPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Kariyer
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem", lineHeight: 1.8, maxWidth: "500px" }}>
            Luir ailesine katılın. Birlikte büyüyen, birbirini destekleyen ve mükemmelliği hedefleyen bir ekibiz.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 3rem" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "4rem" }}>
          {[
            { title: "Esnek Çalışma", desc: "Hibrit ve uzaktan çalışma imkanları" },
            { title: "Gelişim Bütçesi", desc: "Kişisel ve mesleki gelişim için yıllık bütçe" },
            { title: "Ürün İndirimi", desc: "Tüm Luir ürünlerinde %40 personel indirimi" },
          ].map((b, i) => (
            <div key={i} style={{ padding: "1.5rem", border: "0.5px solid #efefef", textAlign: "center" as const }}>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", fontWeight: 300, marginBottom: "0.5rem" }}>{b.title}</div>
              <div style={{ fontSize: "12px", color: "#888" }}>{b.desc}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1.5rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
          Açık Pozisyonlar
        </h2>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem", marginBottom: "3rem" }}>
          {positions.map((pos, i) => (
            <div key={i} style={{ padding: "1.5rem", border: "0.5px solid #efefef", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "6px", flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", background: "#F8F8F8", color: "#888" }}>{pos.dept}</span>
                  <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", background: "#F8F8F8", color: "#888" }}>{pos.type}</span>
                </div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", fontWeight: 300, marginBottom: "6px" }}>{pos.title}</div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>{pos.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#bbb" }}>
                  <MapPin size={11} /> {pos.location}
                </div>
              </div>
              <a href={"mailto:kariyer@luir.com?subject=" + pos.title} style={{ background: "#0A0A0A", color: "#fff", padding: "8px 16px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                Başvur <ChevronRight size={11} />
              </a>
            </div>
          ))}
        </div>

        <div style={{ background: "#F8F8F8", padding: "2rem" }}>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, marginBottom: "0.5rem" }}>Pozisyon bulamadınız mı?</div>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7, marginBottom: "1rem" }}>
            Açık pozisyon olmasa da özgeçmişinizi bize iletebilirsiniz. Uygun bir pozisyon açıldığında sizi arayalım.
          </p>
          <a href="mailto:kariyer@luir.com" style={{ background: "#0A0A0A", color: "#fff", padding: "10px 20px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)", display: "inline-block" }}>
            Özgeçmiş Gönder
          </a>
        </div>
      </div>
    </main>
  )
}