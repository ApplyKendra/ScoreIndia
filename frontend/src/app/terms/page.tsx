'use client';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Last updated: January 2026
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            By accessing and using the ISKCON Burla platform, you accept and agree to be bound by
                            these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Use of Services</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Our platform provides services including:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Online prasadam ordering</li>
                            <li>Temple store purchases</li>
                            <li>Donation processing</li>
                            <li>Event registrations</li>
                            <li>Live darshan streaming</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. User Accounts</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            You are responsible for maintaining the confidentiality of your account credentials
                            and for all activities that occur under your account. Please notify us immediately
                            of any unauthorized use.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Donations</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            All donations are voluntary and made at the discretion of the donor. Donations are
                            used to support temple activities, community programs, and spreading Krishna consciousness.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Contact</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            For any questions regarding these terms, please contact us at:
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>ISKCON Burla</strong><br />
                            Email: info@iskconburla.com<br />
                            Phone: +91 87630 25178
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
