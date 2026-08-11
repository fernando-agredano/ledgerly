import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setConfirmationNotice(false);

    if (mode === "signin") {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        setError(traducirError(error));
        return;
      }
      toast.success("Sesión iniciada", `Bienvenido de nuevo, ${email}.`);
      navigate(from, { replace: true });
      return;
    }

    const { error, needsConfirmation } = await signUp(email, password, nombre);
    setSubmitting(false);
    if (error) {
      setError(traducirError(error));
      return;
    }
    if (needsConfirmation) {
      setConfirmationNotice(true);
      return;
    }
    toast.success("Cuenta creada", `Bienvenido a Ledgerly, ${nombre || email}.`);
    navigate(from, { replace: true });
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">
          {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "signin"
            ? "Accede a la plataforma de crédito privado."
            : "Regístrate para acceder a la plataforma."}
        </p>
      </div>

      {confirmationNotice ? (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-900 text-center">
          Te enviamos un correo a <span className="font-medium">{email}</span> para
          confirmar tu cuenta. Una vez confirmada, inicia sesión normalmente.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {mode === "signup" && (
            <Input
              label="Nombre completo"
              placeholder="Ana López"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          )}
          <Input
            label="Correo electrónico"
            placeholder="usuario@empresa.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            placeholder="••••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting
              ? "Un momento…"
              : mode === "signin"
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </Button>
        </form>
      )}

      <p className="mt-8 text-sm text-center text-slate-500">
        {mode === "signin" ? (
          <>
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className="text-brand-600 font-medium hover:underline"
            >
              Crear una
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className="text-brand-600 font-medium hover:underline"
            >
              Inicia sesión
            </button>
          </>
        )}
      </p>

      <p className="mt-10 text-xs text-center text-slate-400">
        © 2026 Ledgerly. Todos los derechos reservados.
      </p>
    </div>
  );
}

function traducirError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (message.includes("User already registered")) {
    return "Ya existe una cuenta con ese correo — inicia sesión en vez de crear una nueva.";
  }
  if (message.includes("Password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  return message;
}
