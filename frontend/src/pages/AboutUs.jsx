import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const AboutUs = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-blue-100 flex flex-col">
            <nav className="w-full bg-gray-100 shadow-md py-3 flex justify-center items-center fixed top-0 left-0 z-50">
                <img
                    src="/logo.png"
                    alt="Voting System Logo"
                    className="h-20 w-auto object-contain cursor-pointer"
                    onClick={() => navigate("/")}
                />
            </nav>

            <div className="flex flex-col items-center px-6 pt-32 pb-16">
                <h1 className="text-3xl md:text-4xl font-bold text-blue-900 text-center mb-8">
                    {t("aboutNayamat")}
                </h1>

                <p className="text-xl text-gray-700 leading-relaxed text-left max-w-3xl font-medium mb-10">
                    {t("about")}
                </p>

                <div className="bg-gray-50 shadow-lg rounded-2xl p-10 mb-10 max-w-3xl mx-auto text-left">
                    <h2 className="text-2xl font-semibold text-blue-600 mb-4 text-center">
                        {t("aim")}
                    </h2>
                    <p className="text-gray-700 font-medium leading-relaxed text-lg">
                        {t("aimPart")}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-5xl w-full mx-auto">
                    <div className="bg-gray-50 shadow-md rounded-2xl p-8 min-h-[240px] hover:shadow-lg transition text-left">
                        <h3 className="text-xl font-semibold text-blue-800 mb-2 text-center">
                            🔒 {t("secure")}
                        </h3>
                        <p className="text-gray-600">
                            {t("securePart")}
                        </p>
                    </div>

                    <div className="bg-gray-50 shadow-md rounded-2xl p-8 min-h-[240px] hover:shadow-lg transition text-left">
                        <h3 className="text-xl font-semibold text-blue-800 mb-2 text-center">
                            ⚡{t("fast")}
                        </h3>
                        <p className="text-gray-600">
                            {t("fastPart")}
                        </p>
                    </div>

                    <div className="bg-gray-50 shadow-md rounded-2xl p-8 min-h-[240px] hover:shadow-lg transition text-left">
                        <h3 className="text-xl font-semibold text-blue-800 mb-2 text-center">
                            🌍 {t("transparent")}
                        </h3>
                        <p className="text-gray-600">
                            {t("transparentPart")}
                        </p>
                    </div>

                </div>

                <p className="text-gray-700 max-w-3xl text-left text-lg pb-10">
                    {t("future")}
                </p>
            </div>

        </div>

    );
};

export default AboutUs;
