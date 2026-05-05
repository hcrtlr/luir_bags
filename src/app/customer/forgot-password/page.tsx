"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("E-posta alani zorunludur.")
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      })

      if (resetError) {
        if (resetError.message.includes("rate limit")) {
          setError("Cok fazla deneme. Lutfen bekleyin.")
        } else {
          setError(resetError.message)
        }
        setLoading(false)
        return
      }

      setSent(true)

    } catch (err) {
      setError("Beklenmedik bir hata olustu.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid var(--border)",
    padding: "8px 0",
    fontSize: "0.9rem",
    color: "var(--foreground)",
    background: "transparent",
    outline: "none",
    fontFamily: "var(--font-dm-sans)",
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "4px",
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border)" }}>

        <div style={{ background: "var(--foreground)", padding: "2rem 2.5rem" }}>
          <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "var(--background)", textDecoration: "none", letterSpacing: "0.1em", display: "block", marginBottom: "1rem" }}>
            LUIR
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "var(--background)", lineHeight: 1.15 }}>
            Sifremi<br />
            <em style={{ fontStyle: "italic", color: "var(--muted)" }}>unuttum.</em>
          </h1>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7 }}>
              E-posta adresinizi girin, sifre sifirlama baglantisinı gönderelim.
            </p>

            <div>
              <label style={labelStyle}>E-posta</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.75rem", color: "var(--error)", padding: "0.6rem 0.8rem", border: "1px solid var(--error)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: "var(--foreground)", color: "var(--background)", border: "none", padding: "0.9rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: loading ? 0.6 : 1, marginTop: "0.5rem" }}
            >
              {loading ? "Gonderiliyor..." : "Baglanti Gonder"}
            </button>

            <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>
              <Link href="/customer/login" style={{ color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
                Geri don
              </Link>
            </p>

          </form>
        ) : (
          <div style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", textAlign: "center" }}>

            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "1px solid var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "0.5rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300 }}>
              Baglanti gonderildi
            </h2>

            <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7, maxWidth: "320px" }}>
              <strong style={{ color: "var(--foreground)" }}>{email}</strong> adresine sifre sifirlama baglantisinı gonderdik. Lutfen gelen kutunuzu kontrol edin.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", margin: "0.5rem 0" }}>
              <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
              <span style={{ fontSize: "0.7rem", color: "var(--muted-light)", letterSpacing: "0.1em" }}>veya</span>
              <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
            </div>

            <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
              <Link href="/login" style={{ color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
                Geri don
              </Link>
            </p>

          </div>
        )}

      </div>
    </main>
  )
}