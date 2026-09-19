import { supabase } from "./supabase";
import { findAuthorizedOfficer, getOfficerCanonicalEmail } from "../constants/authorizedOfficers";

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

export async function signInUnified(params: {
  identifier: string;
  password: string;
  preferredRole?: Role;
}) {
  const trimmed = params.identifier.trim();

  // 1. Check if it's an Officer ID (e.g. OFFICER-SWM-101)
  const authOfficer = findAuthorizedOfficer(trimmed);
  if (authOfficer) {
    return signInOfficer({
      officerId: authOfficer.officerId,
      password: params.password,
    });
  }

  // 2. Check if it's an email
  if (trimmed.includes("@")) {
    const res = await signIn({ email: trimmed, password: params.password });
    return res;
  }

  // 3. Check if it's a 10-digit phone number
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    const roleCandidates: string[] = [];
    if (params.preferredRole) {
      roleCandidates.push(`${digits}.${params.preferredRole}@kawa.app`);
    }
    roleCandidates.push(`${digits}@kawa.app`);
    if (params.preferredRole === "customer") {
      roleCandidates.push(`${digits}.kabadiwala@kawa.app`);
    } else if (params.preferredRole === "kabadiwala") {
      roleCandidates.push(`${digits}.customer@kawa.app`);
    }

    let lastError: any = null;
    for (const emailCandidate of roleCandidates) {
      try {
        const res = await signIn({ email: emailCandidate, password: params.password });
        if (res?.user) return res;
      } catch (err: any) {
        lastError = err;
      }
    }
    throw lastError || new Error("Invalid phone number or password.");
  }

  // Fallback direct sign-in attempt
  return signIn({ email: trimmed, password: params.password });
}

export async function signInOfficer(params: {
  officerId: string;
  password: string;
}) {
  const authOfficer = findAuthorizedOfficer(params.officerId);
  if (!authOfficer) {
    throw new Error("Unauthorized Officer ID. Please enter a valid government-assigned Officer ID.");
  }

  const canonicalEmail = getOfficerCanonicalEmail(authOfficer.officerId);

  try {
    const data = await signIn({
      email: canonicalEmail,
      password: params.password,
    });

    if (data?.user) {
      // Ensure profile is marked verified and role is officer
      try {
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            role: "officer",
            verified: true,
            name: authOfficer.name,
            gov_id_number: authOfficer.officerId,
            department: `${authOfficer.department} (${authOfficer.zone})`,
          }, { onConflict: "id" });
      } catch {}
    }

    return data;
  } catch (err: any) {
    // If sign-in failed because account doesn't exist yet on Supabase Auth,
    // auto-register the officer with the supplied password!
    try {
      const reg = await signUp({
        email: canonicalEmail,
        password: params.password,
        role: "officer",
        name: authOfficer.name,
        govIdNumber: authOfficer.officerId,
        department: `${authOfficer.department} (${authOfficer.zone})`,
      });

      // Ensure verified flag in profiles table
      if (reg?.user) {
        try {
          await supabase
            .from("profiles")
            .update({ verified: true, role: "officer" })
            .eq("id", reg.user.id);
        } catch {}
      }

      return reg;
    } catch (regErr: any) {
      // If user already registered with different password, rethrow original error
      throw err;
    }
  }
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
