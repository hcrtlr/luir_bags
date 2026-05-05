"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError("E-posta veya sifre yanlis.")
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("E-posta adresiniz dogrulanmamis.")
        } else if (signInError.message.includes("rate limit")) {
          setError("Cok fazla deneme. Lutfen bekleyin.")
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      router.push("/customer")

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
            Tekrar hoşgeldiniz.
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          <div>
            <label style={labelStyle}>E-posta</label>
            <input
              style={inputStyle}
              name="email"
              type="email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Sifre</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: "28px" }}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href="/customer/forgot-password" style={{ fontSize: "0.72rem", color: "var(--muted)", textDecoration: "none", borderBottom: "1px solid var(--border)", paddingBottom: "1px" }}>
              Sifremi unuttum
            </Link>
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
            {loading ? "Giris yapiliyor..." : "Giris Yap"}
          </button>

          <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>
            Hesabin yok mu?{" "}
            <Link href="/customer/register" style={{ color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
              Kayit ol
            </Link>
          </p>

        </form>
      </div>
    </main>
  )
}
