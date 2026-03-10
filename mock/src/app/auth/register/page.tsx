"use client";

import { useState } from "react";
import Link from "next/link";
import {
    RACE_OPTIONS,
    GENDER_OPTIONS,
    INCOME_BRACKETS,
    COUNTY_OPTIONS,
    EDUCATION_OPTIONS,
    INDUSTRY_OPTIONS,
} from "@/lib/mock_data";

export default function RegisterPage() {
    const [step, set_step] = useState(1);

    const [account, set_account] = useState({
        email: "",
        password: "",
        confirm_password: "",
        language_pref: "en",
    });

    const [demographics, set_demographics] = useState({
        race: "",
        gender: "",
        age: "",
        annual_personal_income: "",
        annual_household_income: "",
        county: "",
        has_children_under_18: false,
        has_children_under_5: false,
        educational_attainment: "",
        has_personal_vehicle: false,
        is_employed: false,
        industry_area: "",
    });

    const [consent, set_consent] = useState(false);

    function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        if (step === 1) {
            if (account.password !== account.confirm_password) {
                alert("Passwords do not match");
                return;
            }
            set_step(2);
        } else if (step === 2) {
            set_step(3);
        } else {
            if (!consent) {
                alert("You must consent to data collection to register.");
                return;
            }
            alert("Mock registration complete!");
        }
    }

    return (
        <div className="max-w-lg mx-auto mt-8">
            <div className="text-center mb-8">
                <span className="text-5xl">🌿</span>
                <h1 className="text-2xl font-bold text-slate-900 mt-3">Create Account</h1>
                <p className="text-slate-500 text-sm mt-1">Join the Esperanza community</p>
            </div>

            {/* progress bar */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? "bg-blue-500" : "bg-slate-200"
                            }`}
                    />
                ))}
            </div>
            <p className="text-xs text-slate-400 text-center mb-4">
                Step {step} of 3 — {step === 1 ? "Account" : step === 2 ? "Demographics" : "Consent"}
            </p>

            <div className="card p-6">
                <form onSubmit={handle_submit} className="space-y-4">
                    {step === 1 && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                                <input type="email" className="input" required placeholder="you@example.com"
                                    value={account.email} onChange={(e) => set_account({ ...account, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                                <input type="password" className="input" required placeholder="••••••••"
                                    value={account.password} onChange={(e) => set_account({ ...account, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Confirm Password</label>
                                <input type="password" className="input" required placeholder="••••••••"
                                    value={account.confirm_password} onChange={(e) => set_account({ ...account, confirm_password: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Preferred Language</label>
                                <select className="select"
                                    value={account.language_pref} onChange={(e) => set_account({ ...account, language_pref: e.target.value })}>
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <p className="text-sm text-slate-500 mb-2">
                                This information helps us connect you with relevant services. All fields are optional.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Race</label>
                                    <select className="select" value={demographics.race}
                                        onChange={(e) => set_demographics({ ...demographics, race: e.target.value })}>
                                        <option value="">Select...</option>
                                        {RACE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Gender</label>
                                    <select className="select" value={demographics.gender}
                                        onChange={(e) => set_demographics({ ...demographics, gender: e.target.value })}>
                                        <option value="">Select...</option>
                                        {GENDER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Age</label>
                                    <input type="number" className="input" placeholder="Age" min="0" max="120"
                                        value={demographics.age} onChange={(e) => set_demographics({ ...demographics, age: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Personal Income</label>
                                    <select className="select" value={demographics.annual_personal_income}
                                        onChange={(e) => set_demographics({ ...demographics, annual_personal_income: e.target.value })}>
                                        <option value="">Select...</option>
                                        {INCOME_BRACKETS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Household Income</label>
                                    <select className="select" value={demographics.annual_household_income}
                                        onChange={(e) => set_demographics({ ...demographics, annual_household_income: e.target.value })}>
                                        <option value="">Select...</option>
                                        {INCOME_BRACKETS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">County</label>
                                    <select className="select" value={demographics.county}
                                        onChange={(e) => set_demographics({ ...demographics, county: e.target.value })}>
                                        <option value="">Select...</option>
                                        {COUNTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Education</label>
                                    <select className="select" value={demographics.educational_attainment}
                                        onChange={(e) => set_demographics({ ...demographics, educational_attainment: e.target.value })}>
                                        <option value="">Select...</option>
                                        {EDUCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Industry</label>
                                    <select className="select" value={demographics.industry_area}
                                        onChange={(e) => set_demographics({ ...demographics, industry_area: e.target.value })}>
                                        <option value="">Select...</option>
                                        {INDUSTRY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={demographics.has_children_under_18}
                                        onChange={(e) => set_demographics({ ...demographics, has_children_under_18: e.target.checked })} />
                                    I have children under 18
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={demographics.has_children_under_5}
                                        onChange={(e) => set_demographics({ ...demographics, has_children_under_5: e.target.checked })} />
                                    I have children under 5
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={demographics.has_personal_vehicle}
                                        onChange={(e) => set_demographics({ ...demographics, has_personal_vehicle: e.target.checked })} />
                                    I have a personal vehicle
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={demographics.is_employed}
                                        onChange={(e) => set_demographics({ ...demographics, is_employed: e.target.checked })} />
                                    I am currently employed
                                </label>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                                <h3 className="font-semibold mb-2">Data Collection Consent</h3>
                                <p className="mb-3">
                                    By creating an account, you agree to the following:
                                </p>
                                <ul className="space-y-1.5 list-disc list-inside text-blue-700">
                                    <li>Your demographic information will be used to connect you with relevant services</li>
                                    <li>In-app behavior (searches, page views, RSVPs) may be tracked for service improvement</li>
                                    <li>Your personal identity will not be shared with service providers without your consent</li>
                                    <li>Only individual social service providers will know your personal information during service delivery</li>
                                    <li>You can update or delete your information at any time from your profile</li>
                                </ul>
                            </div>
                            <label className="flex items-start gap-3 text-sm text-slate-700 pt-2">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => set_consent(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>
                                    I understand and consent to the data collection practices described above.
                                </span>
                            </label>
                        </>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        {step > 1 && (
                            <button type="button" onClick={() => set_step(step - 1)} className="btn btn-secondary flex-1">
                                Back
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary flex-1">
                            {step === 3 ? "Create Account" : "Next"}
                        </button>
                    </div>
                </form>

                {step === 1 && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
