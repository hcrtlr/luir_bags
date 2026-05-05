import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"

const pressItems = [
  { date: "Mart 2025", source: "Vogue Türkiye", title: "Yerli Markalar Yükselişte: Luir'in Başarı Hikayesi", type: "Röportaj" },
  { date: "Ocak 2025", source: "Hürriyet Ekonomi", title: "Luir, 2024'ü Rekor Büyümeyle Kapattı", type: "Haber" },
  { date: "Kasım 2024", source: "Elle Decoration TR", title: "En İyi Yerli Deri Aksesuar Markaları", type: "Liste" },
  { date: "Eylül 2024", source: "Forbes Türkiye", title: "Sürdürülebilir Modanın Yükselen Yıldızları", type: "Röportaj" },
]

export default function BasinPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Basın
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem" }}>Luir hakkında basında yer alan haberler ve basın materyalleri.</p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 3rem" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "4rem" }}>
          <div style={{ padding: "2rem", border: "0.5px solid #efefef" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>Basın İletişimi</div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, marginBottom: "0.5rem" }}>Medya Sorularınız İçin</div>
            <a href="mailto:basin@luir.com" style={{ fontSize: "13px", color: "#0A0A0A", display: "block" }}>basin@luir.com</a>
            <p style={{ fontSize: "12px", color: "#888", marginTop: "0.5rem" }}>Hafta içi 09:00 - 18:00</p>
          </div>
          <div style={{ padding: "2rem", border: "0.5px solid #efefef" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>Basın Kiti</div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, marginBottom: "0.5rem" }}>Logo & Marka Kılavuzu</div>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "1rem" }}>Yüksek çözünürlüklü logo, marka renkleri ve kullanım kılavuzunu indirin.</p>
            <button style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "8px 16px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={11} /> İndir
            </button>
          </div>
        </div>

        <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1.5rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
          Basında Luir
        </h2>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "0" }}>
          {pressItems.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "1.5rem", padding: "1.5rem 0", borderBottom: "0.5px solid #efefef", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: "100px" }}>
                <div style={{ fontSize: "11px", color: "#888" }}>{item.date}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: "4px" }}>{item.source} · {item.type}</div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", fontWeight: 300, color: "#0A0A0A" }}>{item.title}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}