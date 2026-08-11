import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { Profile } from "@/hooks/useProfile";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export function UserProfileModal({
  open,
  onClose,
  profile,
  onUpdateProfile,
  onUploadPhoto,
}: {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdateProfile: (patch: { nombre: string; rol: string }) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<string>;
}) {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(profile?.nombre ?? "");
  const [rol, setRol] = useState(profile?.rol ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(profile?.nombre ?? "");
      setRol(profile?.rol ?? "");
      setPreviewUrl(null);
      setPhotoError(null);
      setSaveError(null);
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile]);

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);

    if (!file.type.startsWith("image/")) {
      setPhotoError("Selecciona un archivo de imagen.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("La imagen debe pesar menos de 3 MB.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      await onUploadPhoto(file);
      toast.success("Foto actualizada", "Tu foto de perfil se actualizó correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo subir la foto.";
      setPhotoError(message);
      setPreviewUrl(null);
      toast.error("No se pudo subir la foto", message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await onUpdateProfile({ nombre: nombre.trim() || "Sin nombre", rol: rol.trim() });
      setSaved(true);
      toast.success("Perfil actualizado", "Tus cambios se guardaron correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el perfil.";
      setSaveError(message);
      toast.error("No se pudo guardar el perfil", message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    onClose();
    navigate("/login", { replace: true });
  }

  const fotoMostrada = previewUrl ?? profile?.foto_url ?? null;

  return (
    <Modal open={open} onClose={onClose} title="Tu perfil">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-28 w-28 rounded-full border-2 border-slate-300 flex items-center justify-center overflow-hidden text-slate-700 font-semibold text-2xl">
              {fotoMostrada ? (
                <img src={fotoMostrada} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(nombre || "?")
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0.5 right-0.5 h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm hover:bg-brand-700 disabled:opacity-60"
              title="Cambiar foto"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoSelected}
            />
          </div>
          {uploading && <p className="text-xs text-slate-500">Subiendo foto…</p>}
          {photoError && <p className="text-xs text-red-600">{photoError}</p>}
        </div>

        <Input
          label="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <Input label="Rol / cargo" value={rol} onChange={(e) => setRol(e.target.value)} />

        <p className="text-xs text-slate-400">{user?.email}</p>

        {saveError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 mt-4"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-emerald-600 font-medium">
              {saved ? "Guardado ✓" : ""}
            </span>
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
