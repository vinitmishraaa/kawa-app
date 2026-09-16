import { supabase } from "./supabase";

export type Role = "customer" | "kabadiwala" | "officer";

export async function signUp(params: {
  email: string;
  password: string;
  role: Role;
  name: string;
  phone?: string;
}) {
  const { email, password, role, name, phone } = params;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Sign up did not return a user.");

  // Officers start unverified; customer/kabadiwala are auto-verified
  // since they don't need the document-review step (Phase 2).
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role,
    name,
    phone: phone ?? null,
    verified: role !== "officer",
  });
  if (profileError) throw profileError;

  return data;
}

export async function signIn(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}
