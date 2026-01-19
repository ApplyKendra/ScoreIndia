'use client';

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">Refund Policy</h1>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Last updated: January 2026
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Donations</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Donations made to ISKCON Burla are generally non-refundable as they are considered
                            voluntary contributions for religious and charitable purposes. However, in case of
                            technical errors or duplicate payments, please contact us within 7 days for resolution.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Prasadam Orders</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            For prasadam orders:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Cancellations made before order confirmation are eligible for full refund</li>
                            <li>Once an order is being prepared, refunds may not be possible</li>
                            <li>For quality issues, please contact us immediately for resolution</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Temple Store Purchases</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Items purchased from the temple store may be returned within 7 days of delivery if:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                            <li>The item is unused and in original packaging</li>
                            <li>The item is defective or damaged during shipping</li>
                            <li>The wrong item was delivered</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Refund Process</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Once your refund request is approved, the amount will be credited to your original
                            payment method within 5-10 business days.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Contact Us</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            For refund requests or questions, please contact:
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
