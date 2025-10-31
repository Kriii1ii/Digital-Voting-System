import React, { createContext, useContext, useState } from "react";

const translations = {
  en: {
    english: "English",
    nepali: "नेपाली",
    loginRegister: "Login / Register",
    welcome: "Welcome to NayaMat",
    nayamat: "Your voice matters. Participate in a secure, transparent, and easy to use digital voting system. Democracy is now at your fingertips. Every vote counts, and every citizen has the power to shape the future. Join a community of responsible voters and help build a fairer, more inclusive, and connected society for everyone.",
    nayamatfooter: " © 2025 Nayamat Nepal. All Rights Reserved.",

    // Registration & Login
    registration: "Voter Registration",
    registrationSubtitle: "Register to participate in elections",
    personalInfo: "Personal Information",
    biometricRegistration: "Biometric Registration",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    dateOfBirth: "Date of Birth",
    email: "Email Address",
    emailPlaceholder: "Enter your email address",
    phone: "Phone Number",
    phonePlaceholder: "Enter your phone number",
    citizenshipNumber: "Citizenship Number",
    citizenshipPlaceholder: "Enter your citizenship number",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    role: "Role",
    voter: "Voter",
    voters: "Voters",
    candidate: "Candidate",
    candidates: "Candidates",
    electrolCommittee: "Electrol Committee",
    admin: "Admin",
    register: "Register Now",
    alreadyRegistered: "Already registered?",
    login: "Login",
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
    voteridPlaceholder: "Enter your Voter ID",
    home: "Home",
    aboutUs: "About Us",
    contactUs: "Contact Us",


    provinces: [
      "Province 1",
      "Madhesh Province",
      "Bagmati Province",
      "Gandaki Province",
      "Lumbini Province",
      "Karnali Province",
      "Sudurpashchim Province"
    ],

    aboutNayamat: "About NayaMat - A Digital Voting System",
    about: "Welcome to our Digital Voting System — a secure, transparent, and user-friendly platform designed to make voting simple, efficient, and trustworthy. Our mission is to revolutionize the way people participate in elections by combining modern technology with democratic values. Our system ensures that every individual's voice is heard, every vote is protected, and every result is delivered with integrity. We believe in empowering people through innovation because democracy thrives when it is accessible to all.",
    aim: "What We Aim For",
    aimPart: " We aim to eliminate barriers in traditional voting systems by ensuring accessibility, accuracy, and data integrity. Every vote matters, and we are committed to making sure each one is counted with the highest level of security and fairness. Our system is designed to promote trust, transparency, and inclusivity, empowering every voter to confidently take part in shaping a better future.",
    secure: "Secure",
    securePart: "Our platform uses encrypted data storage and verification methods to ensure your vote stays confidential.",
    fast: "Fast",
    fastPart: "Designed with speed and simplicity in mind, so you can cast your vote within seconds.",
    transparent: "Transparent",
    transparentPart: "Real-time vote tracking and clear results ensure full transparency throughout the election process.",
    future: "Together, we are shaping a smarter, fairer, and more connected democratic future. 💙",

    ques: "Have questions, suggestions, or feedback? We would love to hear from you! Fill out the form below and we will get back to you as soon as possible.",
    name: "Name",
    namePlaceholder: "Enter your name",
    message: "Message",
    messagePlaceholder: "Enter your message",
    sendmsg: "Send Message",
    nayaMat: "NAYAMAT",
    nayaMatpart: "Welcome to Nayamat Nepal. We connect communities through accessible and transparent feedback and voting systems.",
    address: "Address",
    num: "+977 9812345678",
    intouch: "Get in Touch",
    add: "Kathmandu, Nepal",
    admin: "Admin",

    nayaMat: "NayaMat ",
    adminPanel: "Admin Panel",
    systemAdministrator: "System Administrator",
    logout: "Logout",
    dashboard: "Dashboard",
    total: "Total",
    moreInfo: "More Info →",
    voted: "Voted",
    reset: "Reset",
    search: "Search",
    votes: "Votes",
    list: "List",
    addVoter: "Add Voter",
    addNewCandidate: "Add New Candidate",

    close: "✖ Close",
    update: "✔ Update",
    save: "Save",
    addnew: "+ Add New",
    bio: "Bio",
    bioPlaceholder: "Enter your bio",
    photo: "Photo",
    action: "Action",
    edit: "Edit",
    delete: "Delete",
    uploadPhoto: "Upload Photo",
    choosephoto: "Choose Photo",
  },

  np: {
    english: "English",
    nepali: "नेपाली",
    loginRegister: "लगइन / दर्ता गर्नुहोस्",
    welcome: "नया मतमा स्वागत छ",
    nayamat: "तपाईंको आवाज महत्वपूर्ण छ। सुरक्षित, पारदर्शी, र प्रयोग गर्न सजिलो डिजिटल मतदान प्रणालीमा भाग लिनुहोस्। लोकतन्त्र अब तपाईंको हातमा छ। हरेक मत महत्वपूर्ण छ, र प्रत्येक नागरिकले भविष्य निर्माण गर्न शक्ति राख्दछ। जिम्मेवार मतदाताहरूको समुदायमा सहभागी हुनुहोस् र सबैका लागि न्यायसंगत, समावेशी, र जडित समाज निर्माण गर्न मद्दत गर्नुहोस्।",
    nayamatfooter: "© २०२५ नया मत नेपाल। सर्वाधिकार सुरक्षित।",

    // Registration & Login
    registration: "मतदाता दर्ता",
    registrationSubtitle: "चुनावमा भाग लिनको लागि दर्ता गर्नुहोस्",
    personalInfo: "व्यक्तिगत जानकारी",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्",
    dateOfBirth: "जन्म मिति",
    email: "इमेल ठेगाना",
    emailPlaceholder: "आफ्नो इमेल ठेगाना प्रविष्ट गर्नुहोस्",
    phone: "फोन नम्बर",
    phonePlaceholder: "आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्",
    citizenshipNumber: "नागरिकता नम्बर",
    citizenshipPlaceholder: "आफ्नो नागरिकता नम्बर प्रविष्ट गर्नुहोस्",
    password: "पासवर्ड",
    passwordPlaceholder: "आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्",
    confirmPassword: "पासवर्ड पुष्टि गर्नुहोस्",
    confirmPasswordPlaceholder: "आफ्नो पासवर्ड पुन: प्रविष्ट गर्नुहोस्",
    role: "भूमिका",
    voter: "मतदाता",
    voters: "मतदाताहरू",
    candidate: "उम्मेदवार",
    candidates: "उम्मेदवारहरू",
    electrolCommittee: "निर्वाचन समिति",
    admin: "प्रशासक",
    register: "अहिले दर्ता गर्नुहोस्",
    alreadyRegistered: "पहिले नै दर्ता गरिसक्नु भएको छ?",
    login: "लगइन",
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
    voterid: "मतदाता परिचयपत्र",
    voteridPlaceholder: "आफ्नो मतदाता परिचयपत्र नम्बर प्रविष्ट गर्नुहोस्",
    home: "गृहपृष्ठ",
    aboutUs: "हाम्रो बारेमा",
    contactUs: "सम्पर्क गर्नुहोस्",



    provinces: [
      "प्रदेश १",
      "मधेश प्रदेश",
      "बागमती प्रदेश",
      "गण्डकी प्रदेश",
      "लुम्बिनी प्रदेश",
      "कर्णाली प्रदेश",
      "सुदुरपश्चिम प्रदेश"
    ],

    // Admin Dashboard & Voting system
    votingsystem: "मतदान प्रणाली",
    adminpanel: "प्रशासक प्यानल",
    systemAdministrator: "सिस्टम प्रशासक",
    logout: "लगआउट",
    dashboard: "ड्यासबोर्ड",
    total: "कुल",
    moreInfo: "थप जानकारी →",
    voted: "मत दिएका",
    reset: "रिसेट",
    search: "खोज्नुहोस्",
    votes: "मतहरू",
    list: "सूची",
    addVoter: "मतदाता थप्नुहोस्",
    addNewCandidate: "नयाँ उम्मेदवार थप्नुहोस्",

    close: "✖ बन्द गर्नुहोस्",
    update: "✔ अपडेट गर्नुहोस्",
    save: "सेभ गर्नुहोस्",
    addnew: "+ नयाँ थप्नुहोस्",
    bio: "जीवनी",
    bioPlaceholder: "आफ्नो जीवनी प्रविष्ट गर्नुहोस्",
    photo: "फोटो",
    action: "क्रिया",
    edit: "सम्पादन गर्नुहोस्",
    delete: "हटाउनुहोस्",
    uploadPhoto: "फोटो अपलोड गर्नुहोस्",
    choosephoto: "फोटो छान्नुहोस्",

    totalVoters: "कुल मतदाता",
    totalCandidates: "कुल उम्मेदवार",
    winningCandidates: "विजयी उम्मेदवारहरू",

    ques: "कुनै प्रश्न, सुझाव, वा प्रतिक्रिया छ? हामी तपाईंको प्रतिक्रिया सुन्न चाहन्छौं! तलको फारम भर्नुहोस् र हामी सकेसम्म छिटो तपाईंलाई जवाफ दिनेछौं।",
    name: "नाम",
    namePlaceholder: "आफ्नो नाम प्रविष्ट गर्नुहोस्",
    message: "सन्देश",
    messagePlaceholder: "आफ्नो सन्देश प्रविष्ट गर्नुहोस्",
    sendmsg: "सन्देश पठाउनुहोस्",

    nayaMat: "NAYAMAT",
    nayaMatpart: "नया मत नेपालमा स्वागत छ। हामी पहुँचयोग्य र पारदर्शी फिडब्याक र मतदान प्रणाली मार्फत समुदायहरूलाई जोड्छौं।",
    address: "ठेगाना",
    num: "+९७७ ९८१२३४५६७",
    intouch: "सम्पर्कमा रहनुहोस्",
    add: "काठमाडौं, नेपाल",


  }

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
