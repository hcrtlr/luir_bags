import Link from "next/link"
import { ArrowLeft, Leaf, Recycle, Heart, Globe } from "lucide-react"

export default function SurdurulebilirlikPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Sürdürülebilirlik
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem", lineHeight: 1.8 }}>
            Gezegenimize karşı sorumluluklarımızın bilincindeyiz.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 3rem" }}>

        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, lineHeight: 1.7, color: "#0A0A0A", marginBottom: "3rem" }}>
          Luir olarak, moda ile sorumluluğun bir arada var olabileceğine inanıyoruz. Üretimden paketlemeye, teslimatten geri dönüşüme kadar her adımda çevresel etkimizi azaltmaya çalışıyoruz.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          {[
            { icon: <Leaf size={22} />, title: "Doğal Malzemeler", desc: "Ürünlerimizde mümkün olduğunca doğal ve sertifikalı malzemeler kullanıyoruz." },
            { icon: <Recycle size={22} />, title: "Geri Dönüştürülebilir Ambalaj", desc: "Tüm paketleme materyallerimiz %100 geri dönüştürülebilir veya biyobozunur." },
            { icon: <Heart size={22} />, title: "Etik Üretim", desc: "Tedarik zincirimizdeki tüm çalışanların adil koşullarda çalıştığını denetliyoruz." },
            { icon: <Globe size={22} />, title: "Karbon Dengeleme", desc: "Kargo süreçlerimizden kaynaklanan karbon emisyonlarını dengeleme programlarıyla telafi ediyoruz." },
          ].map((item, i) => (
            <div key={i} style={{ padding: "1.5rem", border: "0.5px solid #efefef" }}>
              <div style={{ color: "#3B6D11", marginBottom: "1rem" }}>{item.icon}</div>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", fontWeight: 300, marginBottom: "0.5rem" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "2rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
              2025 Hedeflerimiz
            </h2>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
              {[
                { goal: "Plastik ambalajı tamamen elimine etmek", progress: 80 },
                { goal: "Üretimde su kullanımını %30 azaltmak", progress: 55 },
                { goal: "Tedarik zincirinde karbon nötr olmak", progress: 40 },
                { goal: "Tüm ürünleri geri dönüştürülebilir yapmak", progress: 65 },
              ].map((item, i) => (
                <div key={i} style={{ padding: "1rem", border: "0.5px solid #efefef" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#0A0A0A" }}>{item.goal}</span>
                    <span style={{ fontSize: "12px", color: "#3B6D11", fontWeight: 500 }}>%{item.progress}</span>
                  </div>
                  <div style={{ height: "4px", background: "#f0f0f0", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: item.progress + "%", background: "#3B6D11", borderRadius: "2px", transition: "width 0.8s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}