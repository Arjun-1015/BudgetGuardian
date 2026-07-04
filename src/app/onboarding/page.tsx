"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENCIES, PRIORITY_LEVELS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api-client";

interface DependentDraft {
  name: string;
  relation: string;
  age: string;
  monthlyExpense: string;
  priorityLevel: string;
  medicalNeeds: boolean;
}

const emptyDependent: DependentDraft = {
  name: "",
  relation: "",
  age: "",
  monthlyExpense: "0",
  priorityLevel: "medium",
  medicalNeeds: false,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"profile" | "dependents">("profile");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    currency: "INR",
    occupation: "",
    monthlyIncome: "",
    otherIncome: "0",
    salaryDate: "1",
  });

  const [hasDependents, setHasDependents] = useState(false);
  const [dependents, setDependents] = useState<DependentDraft[]>([]);

  function updateProfile(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProfile((p) => ({ ...p, [field]: e.target.value }));
  }

  function addDependent() {
    setDependents((d) => [...d, { ...emptyDependent }]);
  }

  function updateDependent(index: number, field: keyof DependentDraft, value: string | boolean) {
    setDependents((d) => d.map((dep, i) => (i === index ? { ...dep, [field]: value } : dep)));
  }

  function removeDependent(index: number) {
    setDependents((d) => d.filter((_, i) => i !== index));
  }

  async function handleFinish() {
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/user/onboarding", {
        method: "POST",
        body: JSON.stringify({
          profile: {
            currency: profile.currency,
            occupation: profile.occupation || undefined,
            monthlyIncome: Number(profile.monthlyIncome) || 0,
            otherIncome: Number(profile.otherIncome) || 0,
            salaryAmount: Number(profile.monthlyIncome) || 0,
            salaryFrequency: "monthly",
            salaryDate: Number(profile.salaryDate) || 1,
          },
          dependents: hasDependents
            ? dependents
                .filter((d) => d.name.trim())
                .map((d) => ({
                  name: d.name,
                  relation: d.relation || "Other",
                  age: d.age ? Number(d.age) : undefined,
                  monthlyExpense: Number(d.monthlyExpense) || 0,
                  priorityLevel: d.priorityLevel,
                  medicalNeeds: d.medicalNeeds,
                }))
            : [],
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-mist dark:bg-charcoal px-6 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 font-display text-2xl text-ink dark:text-mist">
          {step === "profile" ? "Tell us about your income" : "Who depends on you financially?"}
        </h1>
        <p className="mb-8 text-sm text-ink-soft dark:text-mist/60">
          {step === "profile"
            ? "This powers your safe daily budget calculation."
            : "Optional — skip if it's just you."}
        </p>

        <Card>
          {step === "profile" && (
            <div className="flex flex-col gap-4">
              <Select label="Currency" value={profile.currency} onChange={updateProfile("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Input
                label="Occupation (optional)"
                value={profile.occupation}
                onChange={updateProfile("occupation")}
              />
              <Input
                label="Monthly income"
                type="number"
                min="0"
                value={profile.monthlyIncome}
                onChange={updateProfile("monthlyIncome")}
                required
              />
              <Input
                label="Other income (optional, per month)"
                type="number"
                min="0"
                value={profile.otherIncome}
                onChange={updateProfile("otherIncome")}
              />
              <Input
                label="Salary date (day of month)"
                type="number"
                min="1"
                max="28"
                value={profile.salaryDate}
                onChange={updateProfile("salaryDate")}
                required
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button className="mt-2" onClick={() => setStep("dependents")}>
                Continue
              </Button>
            </div>
          )}

          {step === "dependents" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={!hasDependents ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHasDependents(false)}
                >
                  Only me
                </Button>
                <Button
                  type="button"
                  variant={hasDependents ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHasDependents(true)}
                >
                  I have dependents
                </Button>
              </div>

              {hasDependents && (
                <div className="flex flex-col gap-4">
                  {dependents.map((dep, i) => (
                    <div key={i} className="rounded-xl border border-ink/10 dark:border-white/10 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-ink-soft dark:text-mist/70">
                          Dependent {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDependent(i)}
                          className="text-sm text-danger"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Name"
                          value={dep.name}
                          onChange={(e) => updateDependent(i, "name", e.target.value)}
                        />
                        <Input
                          label="Relation"
                          value={dep.relation}
                          onChange={(e) => updateDependent(i, "relation", e.target.value)}
                        />
                        <Input
                          label="Age"
                          type="number"
                          value={dep.age}
                          onChange={(e) => updateDependent(i, "age", e.target.value)}
                        />
                        <Input
                          label="Monthly expense"
                          type="number"
                          value={dep.monthlyExpense}
                          onChange={(e) => updateDependent(i, "monthlyExpense", e.target.value)}
                        />
                        <Select
                          label="Priority"
                          value={dep.priorityLevel}
                          onChange={(e) => updateDependent(i, "priorityLevel", e.target.value)}
                        >
                          {PRIORITY_LEVELS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </Select>
                        <label className="flex items-center gap-2 text-sm text-ink-soft dark:text-mist/70">
                          <input
                            type="checkbox"
                            checked={dep.medicalNeeds}
                            onChange={(e) => updateDependent(i, "medicalNeeds", e.target.checked)}
                          />
                          Has medical needs
                        </label>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={addDependent}>
                    + Add dependent
                  </Button>
                </div>
              )}

              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="mt-2 flex gap-3">
                <Button variant="secondary" onClick={() => setStep("profile")}>
                  Back
                </Button>
                <Button loading={loading} onClick={handleFinish} className="flex-1">
                  {loading ? "Setting up…" : "Finish setup"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
