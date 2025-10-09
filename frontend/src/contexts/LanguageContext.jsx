import React, { createContext, useContext, useState } from "react";

const translations = {
  en: {
    // Language Selection
    secureVoting: "Secure Digital Voting",
    subtitle: "A secure and accessible online voting platform",
    selectLanguage: "Please select your preferred language",
    english: "English",
    nepali: "नेपाली",
    loginRegister: "Login / Register",

    // Registration & Login
    registration: "Voter Registration",
    registrationSubtitle: "Register to participate in elections",
    personalInfo: "Personal Information",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    contactInfo: "Contact Information",
    email: "Email Address",
    emailPlaceholder: "Enter your email address",
    phone: "Phone Number",
    phonePlaceholder: "Enter your phone number",
    address: "Address",
    addressPlaceholder: "Enter your full address",
    identityVerification: "Identity Verification",
    citizenshipNumber: "Citizenship Number",
    citizenshipPlaceholder: "Enter your citizenship number",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    register: "Register Now",
    alreadyRegistered: "Already registered?",
    login: "Login",
    loginHere: "Login Here",
    back: "Back",
    idType: "ID Type",
    idPlaceholder: "Enter your ID number",
    citizenship: "Citizenship ID",
    national: "National ID",
    passport: "Passport",
    province: "Province",
    selectProvince: "Select Province",
    district: "District",
    districtPlaceholder: "Enter your district",
    ward: "Ward Number",
    wardPlaceholder: "Enter your Ward Number",
    voterid: "Voter ID",
    aboutUs: "About Us",
    contactUs: "Contact Us",
    voterid: "Voter ID",
    voteridPlaceholder: "Enter your Voter ID",

    provinces: [
      "Province 1",
      "Madhesh Province",
      "Bagmati Province",
      "Gandaki Province",
      "Lumbini Province",
      "Karnali Province",
      "Sudurpashchim Province"
    ],
  },

  np: {
    // Language Selection
    secureVoting: "सुरक्षित डिजिटल मतदान",
    subtitle: "एक सुरक्षित र पहुँचयोग्य अनलाइन मतदान प्लेटफर्म",
    selectLanguage: "कृपया आफ्नो मनपर्ने भाषा चयन गर्नुहोस्",
    english: "English",
    nepali: "नेपाली",
    loginRegister: "लगइन / दर्ता गर्नुहोस्",

    // Registration & Login
    registration: "मतदाता दर्ता",
    registrationSubtitle: "चुनावमा भाग लिनको लागि दर्ता गर्नुहोस्",
    personalInfo: "व्यक्तिगत जानकारी",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्",
    dateOfBirth: "जन्म मिति",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    contactInfo: "सम्पर्क जानकारी",
    email: "इमेल ठेगाना",
    emailPlaceholder: "आफ्नो इमेल ठेगाना प्रविष्ट गर्नुहोस्",
    phone: "फोन नम्बर",
    phonePlaceholder: "आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्",
    address: "ठेगाना",
    addressPlaceholder: "आफ्नो पूरा ठेगाना प्रविष्ट गर्नुहोस्",
    identityVerification: "पहिचान प्रमाणीकरण",
    citizenshipNumber: "नागरिकता नम्बर",
    citizenshipPlaceholder: "आफ्नो नागरिकता नम्बर प्रविष्ट गर्नुहोस्",
    password: "पासवर्ड",
    passwordPlaceholder: "आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्",
    confirmPassword: "पासवर्ड पुष्टि गर्नुहोस्",
    confirmPasswordPlaceholder: "आफ्नो पासवर्ड पुन: प्रविष्ट गर्नुहोस्",
    register: "अहिले दर्ता गर्नुहोस्",
    alreadyRegistered: "पहिले नै दर्ता गरिसक्नु भएको छ?",
    login: "लगइन",
    loginHere: "यहाँ लगइन गर्नुहोस्",
    back: "फिर्ता",
    idType: "पहिचान प्रकार",
    idPlaceholder: "आफ्नो ID नम्बर प्रविष्ट गर्नुहोस्",
    citizenship: "नागरिकता ID",
    national: "राष्ट्रिय ID",
    passport: "पासपोर्ट",
    province: "प्रदेश",
    selectProvince: "प्रदेश चयन गर्नुहोस्",
    district: "जिल्ला",
    districtPlaceholder: "आफ्नो जिल्ला प्रविष्ट गर्नुहोस्",
    ward: "वडा नम्बर",
    wardPlaceholder: "आफ्नो वडा नम्बर प्रविष्ट गर्नुहोस्",
    aboutUs: "हाम्रो बारेमा",
    contactUs: "सम्पर्क गर्नुहोस्",
    "voterid": "मतदाता परिचयपत्र",
    "voteridPlaceholder": "आफ्नो मतदाता परिचयपत्र नम्बर प्रविष्ट गर्नुहोस्",

    provinces: [
      "प्रदेश १",
      "मधेश प्रदेश",
      "बागमती प्रदेश",
      "गण्डकी प्रदेश",
      "लुम्बिनी प्रदेश",
      "कर्णाली प्रदेश",
      "सुदुरपश्चिम प्रदेश",
    ],
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const t = (key) => {
    const value = translations[language][key];
    return value !== undefined ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
