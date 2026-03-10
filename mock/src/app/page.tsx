"use client";

import Link from "next/link";
import EventCard from "@/components/event_card";
import ServiceCard from "@/components/service_card";
import {
  get_approved_events,
  mock_services,
  mock_announcements,
  mock_current_user,
  is_user_rsvped,
} from "@/lib/mock_data";

export default function HomePage() {
  const upcoming_events = get_approved_events().slice(0, 3);
  const featured_services = mock_services.slice(0, 3);
  const latest_announcement = mock_announcements[mock_announcements.length - 1];

  function handle_rsvp(event_id: string) {
    alert(`Mock RSVP toggled for event ${event_id}`);
  }

  return (
    <div>
      {/* hero section */}
      <section className="relative rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white p-8 sm:p-12 mb-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Welcome to Esperanza 🌿
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mb-6">
            Your neighborhood portal for community events, local services,
            transit info, and more. Stay connected with what matters.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/events" className="btn bg-white text-blue-600 font-bold no-underline hover:bg-blue-50">
              📅 Browse Events
            </Link>
            <Link href="/services" className="btn bg-blue-700 text-white font-bold no-underline hover:bg-blue-800">
              🤝 View Services
            </Link>
            <Link href="/map" className="btn bg-blue-700 text-white font-bold no-underline hover:bg-blue-800">
              🗺️ Explore Map
            </Link>
          </div>
        </div>
      </section>

      {/* announcement banner */}
      {latest_announcement && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <span className="text-xl">📢</span>
          <div>
            <h3 className="font-semibold text-amber-900 text-sm mb-1">
              {latest_announcement.title_en}
            </h3>
            <p className="text-amber-700 text-sm">
              {latest_announcement.body_en}
            </p>
          </div>
        </div>
      )}

      {/* upcoming events */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
          <Link href="/events" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {upcoming_events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              is_rsvped={is_user_rsvped(mock_current_user.id, event.id)}
              on_rsvp={handle_rsvp}
            />
          ))}
        </div>
      </section>

      {/* services section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Available Services</h2>
          <Link href="/services" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured_services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* quick links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/resources", icon: "📚", label: "Resources" },
          { href: "/map", icon: "🗺️", label: "Neighborhood Map" },
          { href: "/transit", icon: "🚌", label: "Transit / DART" },
          { href: "/profile", icon: "👤", label: "My Profile" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card p-5 text-center no-underline group"
          >
            <div className="text-3xl mb-2">{link.icon}</div>
            <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              {link.label}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
