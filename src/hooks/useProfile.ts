import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  nombre: string;
  rol: string;
  foto_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, rol, foto_url")
      .eq("id", user.id)
      .single();
    if (!error) setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function updateProfile(
    patch: Partial<Pick<Profile, "nombre" | "rol" | "foto_url">>
  ) {
    if (!user) throw new Error("No hay sesión activa.");
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) throw new Error(error.message);
    await refetch();
  }

  async function uploadPhoto(file: File): Promise<string> {
    if (!user) throw new Error("No hay sesión activa.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await updateProfile({ foto_url: url });
    return url;
  }

  return { profile, loading, refetch, updateProfile, uploadPhoto };
}
