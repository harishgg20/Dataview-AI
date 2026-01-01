
export default function PrivacyPage() {
    return (
        <article className="prose max-w-none">
            <h1>Privacy Policy</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                At <strong>Dataview AI</strong>, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal information.
            </p>

            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or use our interactive features.</p>
            <ul>
                <li><strong>Account Information:</strong> Name, email address, and password.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform, including queries run and charts created.</li>
            </ul>

            <h3>2. How We Use Your Information</h3>
            <p>We use the collected information to:</p>
            <ul>
                <li>Provide, maintain, and improve our services.</li>
                <li>Process your transactions and manage your account.</li>
                <li>Send you technical notices, updates, security alerts, and support messages.</li>
            </ul>

            <h3>3. Data Security</h3>
            <p>We implement reasonable security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

            <h3>4. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
        </article>
    );
}
