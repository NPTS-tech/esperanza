export default function PrivacyPolicyPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-12 text-[#2C1810]">
            <h1 className="text-3xl font-bold mb-6 text-[#B7714A]">Privacy Policy</h1>
            <p className="text-sm text-[#6B5C52] mb-8">Last Updated: November 2026</p>

            <section className="space-y-6 text-base leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Overview</h2>
                    <p>
                        Esperanza is dedicated to serving the community while respecting your privacy.
                        This Privacy Policy outlines how we collect, use, and protect your information when using the Esperanza mobile application and web portal.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
                    <ul className="list-disc pl-5 space-y-1 text-[#6B5C52]">
                        <li><strong>Account Details:</strong> Your name and email address when you create an account.</li>
                        <li><strong>Community Activity:</strong> Event RSVPs and category preferences you select.</li>
                        <li><strong>Notifications:</strong> Device push notification tokens if you explicitly grant permission for reminders and updates.</li>
                        <li><strong>Provider Information:</strong> Organization details provided by registered community service providers.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">3. How We Use Information</h2>
                    <p>
                        Your information is used strictly to provide community services, manage event registrations, deliver requested reminders, and improve the app experience.
                        We do not sell, rent, or trade your personal information to third parties.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">4. Data Security & Storage</h2>
                    <p>
                        All communication between your device and our servers is secured via standard HTTPS encryption. Data is stored safely and protected against unauthorized access.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">5. Your Choices & Account Deletion</h2>
                    <p>
                        You may update your profile or delete your account at any time within your profile settings, or by contacting our team at <a href="mailto:privacy@npts.tech" className="text-[#B7714A] underline">privacy@npts.tech</a>.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
                    <p>
                        If you have questions about this policy or your personal data, please contact us at <a href="mailto:privacy@npts.tech" className="text-[#B7714A] underline">privacy@npts.tech</a>.
                    </p>
                </div>
            </section>
        </main>
    );
}
