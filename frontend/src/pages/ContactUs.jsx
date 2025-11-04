import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { sendContactMessage } from "../api/endpoints"; // ✅ import API function

const ContactUs = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await sendContactMessage(formData); // ✅ call backend API
            alert(t("msgsent") || "Message sent! Thank you for contacting us.");
            setFormData({ name: "", email: "", message: "" });
        } catch (err) {
            console.error("Error sending message:", err);
            setError(
                err.response?.data?.message ||
                "Failed to send message. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-blue-50">
            <nav className="w-full bg-gray-100 shadow-md py-3 flex justify-center items-center fixed top-0 left-0 z-50">
                <img
                    src="/logo.png"
                    alt="Voting System Logo"
                    className="h-20 w-auto object-contain cursor-pointer"
                    onClick={() => navigate("/")}
                />
            </nav>

            <main className="flex flex-col items-center w-full flex-grow mt-28 px-4">
                <p className="text-gray-700 text-center max-w-md mb-10">
                    {t("ques")}
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg mb-16"
                >
                    {error && (
                        <p className="text-red-500 text-sm text-center mb-4">
                            {error}
                        </p>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">{t("name")}</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={t("namePlaceholder")}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">{t("email")}</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={t("emailPlaceholder")}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">{t("message")}</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="5"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={t("messagePlaceholder")}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium ${
                            loading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                    >
                        {loading ? t("sending") || "Sending..." : t("sendmsg")}
                    </button>
                </form>
            </main>

            <footer className="w-full bg-white border-t border-gray-200">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10 p-8 text-gray-700">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-blue-900 mb-3">{t("nayaMat")}</h2>
                        <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                            {t("nayaMatpart")}
                        </p>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg text-blue-800 font-semibold mb-3">{t("intouch")}</h3>
                        <p className="text-sm mb-2">
                            <span className="font-medium">{t("email")}:</span> support@nayamat.com
                        </p>
                        <p className="text-sm mb-2">
                            <span className="font-medium">{t("phone")}:</span> {t("num")}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">{t("address")}:</span> {t("add")}
                        </p>
                    </div>
                </div>

                <div className="text-center py-4 border-t border-gray-300 text-sm text-gray-600">
                    {t("nayamatfooter")}
                </div>
            </footer>
        </div>
    );
};

export default ContactUs;
