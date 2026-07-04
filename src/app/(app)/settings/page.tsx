"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/avatar";
import { CURRENCIES } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api-client";
import { resizeImageToDataUrl } from "@/lib/image-resize";

interface Profile {
  name: string;
  username: string;
  email: string;
  currency: string;
  occupation: string | null;
  profilePhoto: string | null;
  monthlyIncome: number;
  otherIncome: number;
  salaryDate: number;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoDraft, setPhotoDraft] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Profile>("/api/user/profile")
      .then((p) => setProfile(p))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPhotoDraft(dataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't process that image.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          currency: profile.currency,
          occupation: profile.occupation || undefined,
          monthlyIncome: Number(profile.monthlyIncome) || 0,
          // Kept in sync with monthlyIncome — see note on the field below.
          salaryAmount: Number(profile.monthlyIncome) || 0,
          otherIncome: Number(profile.otherIncome) || 0,
          salaryDate: Number(profile.salaryDate) || 1,
          ...(photoDraft ? { profilePhoto: photoDraft } : {}),
        }),
      });
      setSuccess(true);
      setPhotoDraft(null);
      // Refresh so the nav bar / everywhere else picks up the new photo/name.
      const refreshed = await apiFetch<Profile>("/api/user/profile");
      setProfile(refreshed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-soft dark:text-mist/50">Loading settings…</p>;
  }
  if (!profile) {
    return <p className="text-sm text-danger">{error ?? "Couldn't load your profile."}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink dark:text-mist">Settings</h1>
        <p className="text-sm text-ink-soft dark:text-mist/60">
          Update the details you gave us during onboarding.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <CardLabel>Profile photo</CardLabel>
            <div className="mt-3 flex items-center gap-4">
              <Avatar name={profile.name} photoUrl={photoDraft ?? profile.profilePhoto} size={72} />
              <div className="flex flex-col gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Choose photo
                </Button>
                {photoDraft && (
                  <button
                    type="button"
                    onClick={() => setPhotoDraft(null)}
                    className="text-left text-xs text-ink-soft underline dark:text-mist/50"
                  >
                    Undo
                  </button>
                )}
                {photoError && <p className="text-xs text-danger">{photoError}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full name"
              value={profile.name}
              onChange={(e) => setProfile((p) => (p ? { ...p, name: e.target.value } : p))}
              required
            />
            <Input label="Username" value={profile.username} disabled />
            <Input label="Email" value={profile.email} disabled className="col-span-2" />
            <Input
              label="Occupation"
              value={profile.occupation ?? ""}
              onChange={(e) => setProfile((p) => (p ? { ...p, occupation: e.target.value } : p))}
            />
            <Select
              label="Currency"
              value={profile.currency}
              onChange={(e) => setProfile((p) => (p ? { ...p, currency: e.target.value } : p))}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <div className="col-span-2">
              <Input
                label="Monthly salary / income"
                type="number"
                min="0"
                value={profile.monthlyIncome}
                onChange={(e) => setProfile((p) => (p ? { ...p, monthlyIncome: Number(e.target.value) } : p))}
                required
              />
              <p className="mt-1 text-xs text-ink-soft dark:text-mist/50">
                This is what your safe daily budget on the dashboard is calculated from — fix it here
                any time it&apos;s wrong.
              </p>
              {profile.monthlyIncome > 0 && profile.monthlyIncome < 1000 && (
                <p className="mt-1 text-xs text-warning">
                  That looks unusually low for a monthly income — double-check it&apos;s not missing a digit.
                </p>
              )}
            </div>
            <Input
              label="Other income (per month)"
              type="number"
              min="0"
              value={profile.otherIncome}
              onChange={(e) => setProfile((p) => (p ? { ...p, otherIncome: Number(e.target.value) } : p))}
            />
            <div>
              <Input
                label="Salary date (day of month)"
                type="number"
                min="1"
                max="31"
                value={profile.salaryDate}
                onChange={(e) => setProfile((p) => (p ? { ...p, salaryDate: Number(e.target.value) } : p))}
                required
              />
              {profile.salaryDate > 28 && (
                <p className="mt-1 text-xs text-ink-soft dark:text-mist/50">
                  In shorter months, this lands on the last day instead (e.g. the 28th/29th in February).
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-safe">Saved.</p>}

          <div>
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-xs text-ink-soft dark:text-mist/40">
        Need to change your household/dependents? That&apos;s on the{" "}
        <a href="/dependents" className="underline">
          Family
        </a>{" "}
        page.
      </p>
    </div>
  );
}
