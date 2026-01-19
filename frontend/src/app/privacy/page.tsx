'use client';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Last updated: January 2026
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We collect information you provide directly to us, such as when you create an account,
                            make a donation, place an order, or contact us. This may include your name, email address,
                            phone number, postal address, and payment information.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Process your donations and orders</li>
                            <li>Send you receipts and updates about your contributions</li>
                            <li>Communicate with you about events and programs</li>
                            <li>Improve our services and user experience</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Information Sharing</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We do not sell, trade, or rent your personal information to third parties.
                            We may share your information only with service providers who assist us in operating
                            our platform and conducting our activities.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Data Security</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We implement appropriate security measures to protect your personal information
                            against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Contact Us</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>ISKCON Burla</strong><br />
                            Email: info@iskconburla.org<br />
                            Phone: +91 98765 43210
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
