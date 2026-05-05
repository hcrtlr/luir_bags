import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BoyutRehberiPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>

      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Boyut Rehberi
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem" }}>Doğru boyutu seçmenize yardımcı olmak için hazırladığımız rehber.</p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 3rem" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "3rem" }}>

          {[
            {
              title: "El Çantaları",
              rows: [
                ["Boyut", "En (cm)", "Boy (cm)", "Derinlik (cm)", "Özellik"],
                ["XS — Mini", "15–18", "10–13", "4–6", "Kart, telefon"],
                ["S — Küçük", "20–24", "14–18", "6–8", "Günlük esansiyeller"],
                ["M — Orta", "25–30", "18–22", "8–10", "Tablet dahil"],
                ["L — Büyük", "32–38", "24–28", "10–12", "A4 evrak"],
              ]
            },
            {
              title: "Sırt Çantaları",
              rows: [
                ["Boyut", "En (cm)", "Boy (cm)", "Hacim (L)", "Laptop"],
                ["S", "28–30", "38–40", "15–20", "13''e kadar"],
                ["M", "30–34", "42–46", "20–30", "15''e kadar"],
                ["L", "34–38", "46–52", "30–40", "17''e kadar"],
              ]
            },
            {
              title: "Valizler",
              rows: [
                ["Boyut", "En (cm)", "Boy (cm)", "Derinlik (cm)", "Kabin Uyumu"],
                ["Kabin (S)", "35–40", "50–55", "20–23", "Tüm havayolları"],
                ["Orta (M)", "42–46", "62–68", "25–28", "Bagaj"],
                ["Büyük (L)", "48–54", "72–78", "28–32", "Bagaj"],
                ["XL", "56–60", "80–85", "32–36", "Bagaj"],
              ]
            },
          ].map((table, ti) => (
            <div key={ti}>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1.2rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
                {table.title}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: "0.5px solid #efefef", background: ri === 0 ? "#FAFAFA" : "transparent" }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: "10px 14px", color: ri === 0 ? "#888" : "#0A0A0A", fontWeight: ri === 0 ? 400 : (ci === 0 ? 500 : 400), letterSpacing: ri === 0 ? "0.08em" : "0", textTransform: ri === 0 ? "uppercase" as const : "none" as const, fontSize: ri === 0 ? "10px" : "13px", whiteSpace: "nowrap" as const }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div style={{ background: "#F8F8F8", padding: "2rem" }}>
            <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, marginBottom: "0.8rem" }}>Nasıl Ölçüm Yapılır?</h3>
            <div style={{ fontSize: "13px", color: "#555", lineHeight: 2 }}>
              <p><strong>En:</strong> Çantanın en geniş noktasından yatay olarak ölçülür.</p>
              <p><strong>Boy:</strong> Alt tabanından en üst noktasına kadar dikey olarak ölçülür.</p>
              <p><strong>Derinlik:</strong> Öne arkaya uzunluğu, en derin noktadan ölçülür.</p>
              <p style={{ marginTop: "0.5rem", color: "#888" }}>Tüm ölçüler tahmini değerdir. Renk veya modele göre hafif farklılık gösterebilir.</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}