
export default function CookiesPage() {
    return (
        <article className="prose max-w-none">
            <h1>Cookie Policy</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                This Cookie Policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.
            </p>

            <h3>1. What Are Cookies?</h3>
            <p>Cookies are small text files that are sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.</p>

            <h3>2. How We Use Cookies</h3>
            <p>We use cookies for the following purposes:</p>
            <ul>
                <li><strong>Essential Cookies:</strong> To authenticate users and prevent fraudulent use of user accounts.</li>
                <li><strong>Analytics Cookies:</strong> To track information how the Service is used so that we can make improvements.</li>
            </ul>

            <h3>3. Your Choices</h3>
            <p>If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.</p>
        </article>
    );
}
