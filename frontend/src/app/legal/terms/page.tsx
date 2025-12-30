
export default function TermsPage() {
    return (
        <article className="prose max-w-none">
            <h1>Terms of Service</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                Please read these Terms of Service ("Terms") carefully before using the <strong>Analytics Platform</strong> operated by us.
            </p>

            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

            <h3>2. Accounts</h3>
            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>

            <h3>3. Intellectual Property</h3>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Analytics Platform and its licensors.</p>

            <h3>4. Termination</h3>
            <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

            <h3>5. Changes</h3>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time.</p>
        </article>
    );
}
