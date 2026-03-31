import { ConfigProvider } from "antd";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "ur";
type Dict = Record<string, string>;

const en: Dict = {
  appTitle: "The Sanctum",
  appSubtitle: "Legal & Property",
  dashboard: "Dashboard",
  clients: "Clients",
  cases: "Cases",
  documentGenerator: "Document Generator",
  templates: "Templates",
  users: "Users",
  activity: "Activity",
  settings: "Settings",
  support: "Support",
  searchPlaceholder: "Search templates or clients...",
  login: "Login",
  logout: "Logout",
  email: "Email",
  password: "Password",
  loginTitle: "Sign in to your account",
  loginSubtitle: "Enter your credentials to continue",
  fullName: "Full Name",
  cnicNumber: "CNIC Number",
  address: "Address",
  buyerName: "Buyer Name",
  sellerName: "Seller Name",
  propertyReference: "Property Reference",
  totalAmount: "Total Amount",
  agreementDate: "Agreement Date",
  generateDocument: "Generate Document",
  resetForm: "Reset Form",
  english: "English",
  urdu: "Urdu",
  welcome: "Welcome",
  save: "Save",
  firstName: "First Name",
  lastName: "Last Name",
  newPassword: "New Password",
  profileSubtitle: "View and update your profile details.",
  vault: "Vault",
  archiveVault: "Archive / Vault",
  title: "Title",
  documentType: "Document type",
  clientOptional: "Client (optional)",
  cnicOptional: "CNIC (optional)",
  nameOptional: "Name (optional)",
  scannedFile: "Scanned file",
  selectFile: "Select file",
  uploadToVault: "Upload to Vault",
  searchByCnic: "Search by CNIC",
  searchByName: "Search by Name",
  searchByDocumentType: "Search by Document type",
  type: "Type",
  date: "Date",
  download: "Download",
  archiveUploaded: "Archive uploaded.",
  uploadFailed: "Upload failed",
  pleaseSelectFile: "Please select a file.",
};

const ur: Dict = {
  appTitle: "دی سینکچم",
  appSubtitle: "قانونی و پراپرٹی",
  dashboard: "ڈیش بورڈ",
  clients: "کلائنٹس",
  cases: "کیسز",
  documentGenerator: "دستاویز ساز",
  templates: "ٹیمپلیٹس",
  users: "یوزرز",
  activity: "سرگرمی",
  settings: "ترتیبات",
  support: "مدد",
  searchPlaceholder: "ٹیمپلیٹس یا کلائنٹس تلاش کریں...",
  login: "لاگ اِن",
  logout: "لاگ آؤٹ",
  email: "ای میل",
  password: "پاس ورڈ",
  loginTitle: "اپنے اکاؤنٹ میں لاگ اِن کریں",
  loginSubtitle: "جاری رکھنے کے لیے معلومات درج کریں",
  fullName: "پورا نام",
  cnicNumber: "شناختی نمبر",
  address: "پتہ",
  buyerName: "خریدار کا نام",
  sellerName: "فروخت کنندہ کا نام",
  propertyReference: "پراپرٹی حوالہ",
  totalAmount: "کل رقم",
  agreementDate: "معاہدہ تاریخ",
  generateDocument: "دستاویز بنائیں",
  resetForm: "فارم ری سیٹ",
  english: "انگریزی",
  urdu: "اردو",
  welcome: "خوش آمدید",
  save: "محفوظ کریں",
  firstName: "پہلا نام",
  lastName: "آخری نام",
  newPassword: "نیا پاس ورڈ",
  profileSubtitle: "اپنی پروفائل تفصیلات دیکھیں اور اپ ڈیٹ کریں۔",
  vault: "والٹ",
  archiveVault: "آرکائیو / والٹ",
  title: "عنوان",
  documentType: "دستاویز کی قسم",
  clientOptional: "کلائنٹ (اختیاری)",
  cnicOptional: "شناختی نمبر (اختیاری)",
  nameOptional: "نام (اختیاری)",
  scannedFile: "اسکین شدہ فائل",
  selectFile: "فائل منتخب کریں",
  uploadToVault: "والٹ میں اپ لوڈ کریں",
  searchByCnic: "شناختی نمبر سے تلاش کریں",
  searchByName: "نام سے تلاش کریں",
  searchByDocumentType: "دستاویز کی قسم سے تلاش کریں",
  type: "قسم",
  date: "تاریخ",
  download: "ڈاؤن لوڈ",
  archiveUploaded: "آرکائیو اپ لوڈ ہو گیا۔",
  uploadFailed: "اپ لوڈ ناکام",
  pleaseSelectFile: "براہ کرم فائل منتخب کریں۔",
};

type I18nContextValue = {
  language: Language;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
  setLanguage: (next: Language) => void;
  toggleLanguage: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const dict = language === "ur" ? ur : en;
  const dir: "ltr" | "rtl" = language === "ur" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      dir,
      t: (key) => dict[key] ?? key,
      setLanguage,
      toggleLanguage: () => setLanguage((prev) => (prev === "en" ? "ur" : "en")),
    }),
    [language, dir, dict]
  );

  return (
    <I18nContext.Provider value={value}>
      <ConfigProvider
        direction={dir}
        theme={{
          token: {
            colorPrimary: "#6366f1",
            borderRadius: 8,
            borderRadiusLG: 12,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

