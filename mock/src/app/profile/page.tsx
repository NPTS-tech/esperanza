"use client";

import { useState } from "react";
import {
    mock_current_user,
    get_user_rsvps,
    get_event_by_id,
    format_date,
    RACE_OPTIONS,
    GENDER_OPTIONS,
    INCOME_BRACKETS,
    COUNTY_OPTIONS,
    EDUCATION_OPTIONS,
    INDUSTRY_OPTIONS,
} from "@/lib/mock_data";

export default function ProfilePage() {
    const user = mock_current_user;
    const user_rsvps = get_user_rsvps(user.id);
    const [editing, set_editing] = useState(false);

    const [form, set_form] = useState({
        race: "White",
        gender: "Male",
        age: "32",
        annual_personal_income: "$35,000 – $49,999",
        annual_household_income: "$50,000 – $74,999",
        county: "Dallas County",
        has_children_under_18: true,
        has_children_under_5: false,
        educational_attainment: "Bachelor's degree",
        has_personal_vehicle: true,
        is_employed: true,
        industry_area: "Information & Technology",
    });

    function handle_save() {
        set_editing(false);
        alert("Mock profile saved!");
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

            {/* account info */}
            <div className="card p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Email</label>
                        <p className="text-sm font-medium text-slate-700">{user.email}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Role</label>
                        <p className="text-sm font-medium text-slate-700">{user.role}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Language</label>
                        <p className="text-sm font-medium text-slate-700">{user.language_pref === "en" ? "English" : "Español"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Member Since</label>
                        <p className="text-sm font-medium text-slate-700">{format_date(user.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* demographics */}
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Demographics</h2>
                    <button
                        onClick={() => editing ? handle_save() : set_editing(true)}
                        className="btn btn-secondary text-sm"
                    >
                        {editing ? "Save" : "Edit"}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Race</label>
                        {editing ? (
                            <select className="select" value={form.race} onChange={(e) => set_form({ ...form, race: e.target.value })}>
                                {RACE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.race}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Gender</label>
                        {editing ? (
                            <select className="select" value={form.gender} onChange={(e) => set_form({ ...form, gender: e.target.value })}>
                                {GENDER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.gender}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Age</label>
                        {editing ? (
                            <input className="input" type="number" value={form.age} onChange={(e) => set_form({ ...form, age: e.target.value })} />
                        ) : (
                            <p className="text-sm text-slate-700">{form.age}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Personal Income</label>
                        {editing ? (
                            <select className="select" value={form.annual_personal_income} onChange={(e) => set_form({ ...form, annual_personal_income: e.target.value })}>
                                {INCOME_BRACKETS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.annual_personal_income}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Household Income</label>
                        {editing ? (
                            <select className="select" value={form.annual_household_income} onChange={(e) => set_form({ ...form, annual_household_income: e.target.value })}>
                                {INCOME_BRACKETS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.annual_household_income}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">County</label>
                        {editing ? (
                            <select className="select" value={form.county} onChange={(e) => set_form({ ...form, county: e.target.value })}>
                                {COUNTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.county}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Education</label>
                        {editing ? (
                            <select className="select" value={form.educational_attainment} onChange={(e) => set_form({ ...form, educational_attainment: e.target.value })}>
                                {EDUCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.educational_attainment}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Industry</label>
                        {editing ? (
                            <select className="select" value={form.industry_area} onChange={(e) => set_form({ ...form, industry_area: e.target.value })}>
                                {INDUSTRY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-slate-700">{form.industry_area}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Children Under 18</label>
                        <p className="text-sm text-slate-700">{form.has_children_under_18 ? "Yes" : "No"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Children Under 5</label>
                        <p className="text-sm text-slate-700">{form.has_children_under_5 ? "Yes" : "No"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Personal Vehicle</label>
                        <p className="text-sm text-slate-700">{form.has_personal_vehicle ? "Yes" : "No"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Employed</label>
                        <p className="text-sm text-slate-700">{form.is_employed ? "Yes" : "No"}</p>
                    </div>
                </div>
            </div>

            {/* my RSVPs */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">My RSVPs</h2>
                {user_rsvps.length === 0 ? (
                    <p className="text-sm text-slate-400">No RSVPs yet.</p>
                ) : (
                    <div className="space-y-3">
                        {user_rsvps.map((rsvp) => {
                            const event = get_event_by_id(rsvp.event_id);
                            if (!event) return null;
                            return (
                                <div key={rsvp.event_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm text-slate-800">{event.title_en}</p>
                                        <p className="text-xs text-slate-500">{format_date(event.start_time)}</p>
                                    </div>
                                    <span className="badge badge-approved">RSVP&apos;d</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
