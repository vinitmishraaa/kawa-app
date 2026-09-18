import { supabase } from "./supabase";

export type Role = "customer" | "kabadiwala" | "officer";

export async function signUp(params: {
  email: string;
  password: string;
  role: Role;
  name: string;
  phone?: string;
  govIdNumber?: string;
  department?: string;
}) {
  const { email, password, role, name, phone, govIdNumber, department } = params;

  // 1. Sign up user with metadata
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        role,
        name: name.trim(),
        phone: phone?.trim() || null,
        gov_id_number: govIdNumber || null,
        department: department || null,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Sign up did not return a user.");

  // 2. If no session returned (e.g. email confirmation required or async delay), sign in immediately
  if (!data.session) {
    const signInResult = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    }).catch(() => null);

    if (signInResult?.data?.session) {
      data.session = signInResult.data.session;
    }
  }

  // 3. Upsert profile directly from client as well
  try {
    const profilePayload: any = {
      id: data.user.id,
      role,
      name: name.trim(),
      phone: phone?.trim() || null,
      verified: true, // Auto-verify so user can access dashboard directly!
    };
    if (govIdNumber) profilePayload.gov_id_number = govIdNumber;
    if (department) profilePayload.department = department;

    await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
  } catch (profileErr) {
    console.log("Profile upsert note (handled by db trigger):", profileErr);
  }

  return data;
}

export async function signIn(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email.trim(),
    password: params.password,
  });
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

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) return data;
  } catch {
    // Continue to fallback
  }

  // Fallback: If profile row is missing in DB, construct one from user metadata and save
  const meta = user.user_metadata || {};
  const fallbackProfile = {
    id: user.id,
    role: (meta.role as Role) || "customer",
    name: meta.name || user.email?.split("@")[0] || "User",
    phone: meta.phone || null,
    verified: true,
    rating: 5,
  };

  try {
    await supabase
      .from("profiles")
      .upsert(fallbackProfile, { onConflict: "id" });
  } catch {
    // Ignore fallback failure
  }

  return fallbackProfile;
}
