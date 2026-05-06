"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const rules = [
  { id: "len", label: "En az 8 karakter", test: (pw: string) => pw.length >= 8 },
  { id: "upper", label: "Buyuk harf icermeli", test: (pw: string) => /[A-Z]/.test(pw) },
  { id: "lower", label: "Kucuk harf icermeli", test: (pw: string) => /[a-z]/.test(pw) },
  { id: "num", label: "Sayi icermeli", test: (pw: string) => /[0-9]/.test(pw) },
]

const strengthColors = [
  "var(--strength-1)",
  "var(--strength-2)",
  "var(--strength-3)",
  "var(--strength-4)",
  "var(--strength-5)",
]

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const passedRules = rules.filter(r => r.test(password))
  const strength = password ? passedRules.length : 0
  const passwordsMatch = confirmPassword ? password === confirmPassword : null

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setValidSession(true)
      }
      setCheckingSession(false)
    }
    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true)
        setCheckingSession(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async ( e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!password) { setError("Sifre alani zorunludur."); return }
    if (strength < 5) { setError("Lutfen tum sifre kurallarini karsılayin."); return }
    if (!confirmPassword) { setError("Sifre tekrar alani zorunludur."); return }
    if (password !== confirmPassword) { setError("Sifreler eslesmiyor."); return }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        if (updateError.message.includes("same password")) {
          setError("Yeni sifreniz eski sifrenizle ayni olamaz.")
        } else {
          setError(updateError.message)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)

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

  if (checkingSession) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Yukleniyor...</p>
      </main>
    )
  }

  if (!validSession) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border)" }}>
          <div style={{ background: "var(--foreground)", padding: "2rem 2.5rem" }}>
            <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "var(--background)", textDecoration: "none", letterSpacing: "0.1em", display: "block", marginBottom: "1rem" }}>
              LUIR
            </Link>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "var(--background)", lineHeight: 1.15 }}>
              Gecersiz<br />
              <em style={{ fontStyle: "italic", color: "var(--muted)" }}>baglanti.</em>
            </h1>
          </div>
          <div style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7 }}>
              Bu sifre sifirlama baglantisinın suresi dolmus veya gecersiz. Lutfen yeniden deneyin.
            </p>
            <Link href="/forgot-password" style={{ background: "var(--foreground)", color: "var(--background)", border: "none", padding: "0.9rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", textDecoration: "none", display: "block", textAlign: "center" }}>
              Yeniden Dene
            </Link>
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>
              <Link href="/customer/login" style={{ color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
                Geri don
              </Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border)" }}>
          <div style={{ background: "var(--foreground)", padding: "2rem 2.5rem" }}>
            <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "var(--background)", textDecoration: "none", letterSpacing: "0.1em", display: "block", marginBottom: "1rem" }}>
              LUIR
            </Link>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "var(--background)", lineHeight: 1.15 }}>
              Sifre<br />
              <em style={{ fontStyle: "italic", color: "var(--muted)" }}>guncellendi.</em>
            </h1>
          </div>
          <div style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "1px solid var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "0.5rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7 }}>
              Sifreniz basariyla guncellendi. Giris sayfasina yonlendiriliyorsunuz...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border)" }}>

        <div style={{ background: "var(--foreground)", padding: "2rem 2.5rem" }}>
          <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "var(--background)", textDecoration: "none", letterSpacing: "0.1em", display: "block", marginBottom: "1rem" }}>
            LUIR
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "var(--background)", lineHeight: 1.15 }}>
            Yeni sifre<br />
            <em style={{ fontStyle: "italic", color: "var(--muted)" }}>belirleyin.</em>
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          <div>
            <label style={labelStyle}>Yeni Sifre *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: "28px" }}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {password && (
              <div style={{ height: "2px", background: "var(--border)", marginTop: "8px", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: strength * 20 + "%", background: strengthColors[strength - 1], borderRadius: "2px", transition: "width 0.4s, background 0.4s" }} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
              {rules.map(rule => {
                const passed = rule.test(password)
                const idle = !password
                return (
                  <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.7rem", color: idle ? "var(--muted-light)" : passed ? "var(--success-dark)" : "var(--error)", transition: "color 0.3s" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: idle ? "var(--border)" : passed ? "var(--success)" : "var(--error)", transition: "background 0.3s" }} />
                    {rule.label}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Yeni Sifre Tekrar *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: "28px" }}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && (
              <p style={{ fontSize: "0.7rem", marginTop: "5px", color: passwordsMatch ? "var(--success-dark)" : "var(--error)" }}>
                {passwordsMatch ? "Sifreler eslesiyor" : "Sifreler eslesmiyor"}
              </p>
            )}
          </div>

          {error && (
            <p style={{ fontSize: "0.75rem", color: "var(--error)", padding: "0.6rem 0.8rem", border: "1px solid var(--error)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{ background: "var(--foreground)", color: "var(--background)", border: "none", padding: "0.9rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: loading ? 0.6 : 1, marginTop: "0.5rem" }}>
            {loading ? "Guncelleniyor..." : "Sifremi Guncelle"}
          </button>

          <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>
            <Link href="/login" style={{ color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
              Geri don
            </Link>
          </p>

        </form>
      </div>
    </main>
  )
}