export default function TermsPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-12 text-[#2C1810]">
            <h1 className="text-3xl font-bold mb-6 text-[#B7714A]">Terms of Service</h1>
            <p className="text-sm text-[#6B5C52] mb-8">Last Updated: November 2026</p>

            <section className="space-y-6 text-base leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
                    <p>
                        By downloading, accessing, or using Esperanza, you agree to comply with and be bound by these Terms of Service.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Community Standards</h2>
                    <p>
                        Esperanza is designed for community support and civic engagement. Users must engage respectfully and refrain from posting false, misleading, or harmful information.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">3. Service Availability</h2>
                    <p>
                        We strive to keep Esperanza accessible at all times, but availability may be subject to periodic updates or maintenance.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">4. Contact Information</h2>
                    <p>
                        For inquiries regarding these terms, please contact <a href="mailto:admin@npts.tech" className="text-[#B7714A] underline">admin@npts.tech</a>.
                    </p>
                </div>
            </section>
        </main>
    );
}
