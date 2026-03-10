import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

const translations = {
    en: {
        dashboard: "Home",
        admin_panel: "Admin Panel",
        hello: "Hello",
        logout: "Logout",
        theme: "Theme",
        login: "Login",
        register: "Register",
        username: "Username",
        password: "Password",
        first_name: "First Name",
        last_name: "Last Name",
        department: "Department",
        sign_in: "Sign In",
        sign_up: "Sign Up",
        no_account: "Don't have an account?",
        has_account: "Already have an account?",
        welcome_back: "Welcome back",
        select_site: "Select Site",
        north_site: "North Site",
        south_site: "South Site",
        current_status: "Current Status",
        in_protected_area: "In Protected Area",
        working: "Working",
        at_home: "At Home",
        on_my_way: "On My Way",
        i_arrived: "I Arrived",
        i_left: "I Left",
        submit_request: "Submit Arrival Request",
        date: "Date",
        start_time: "Start Time",
        end_time: "End Time",
        my_requests: "My Recent Requests",
        no_requests: "No requests found.",
        choose_default_site: "Where are you working today?",
        remember_site: "This will be set as your default site.",
        admin_dashboard: "Admin Dashboard",
        active_workers: "Real-time Active Workers",
        pending_requests: "Pending Arrival Requests",
        attendance_logs: "Attendance Logs",
        user: "User",
        action: "Action",
        site: "Site",
        time: "Time",
        approve: "Approve",
        reject: "Reject",
        all_sites: "All Sites",
        filter_date: "Filter Date",
        filter_site: "Filter Site",
        status: "Current Status",
        since: "Since",
        profile: "Profile",
        update_profile: "Update Profile",
        save_changes: "Save Changes",
        on_site: "On-Site",
        off_site: "Off-Site",
        manage_users: "Manage Users",
        role: "Role",
        make_admin: "Make Admin",
        make_user: "Make User",
        total_headcount: "Total Headcount",
        change_password: "Change Password",
        current_password: "Current Password",
        new_password: "New Password",
        reset_password: "Reset Password",
        must_change_password: "You must change your password before continuing."
    },
    he: {
        dashboard: "מסך הבית",
        admin_panel: "פאנל ניהול",
        hello: "שלום",
        logout: "התנתק",
        theme: "ערכת נושא",
        login: "התחברות",
        register: "הרשמה",
        username: "שם משתמש",
        password: "סיסמה",
        first_name: "שם פרטי",
        last_name: "שם משפחה",
        department: "מחלקה",
        sign_in: "הכנס",
        sign_up: "הירשם",
        no_account: "אין לך חשבון?",
        has_account: "כבר יש לך חשבון?",
        welcome_back: "ברוך שובך",
        select_site: "בחר אתר",
        north_site: "אתר צפון",
        south_site: "אתר דרום",
        current_status: "סטטוס נוכחי",
        in_protected_area: "במרחב מוגן",
        working: "בעבודה",
        at_home: "בבית",
        on_my_way: "בדרך",
        i_arrived: "הגעתי",
        i_left: "יצאתי",
        submit_request: "בקשת הגעה",
        date: "תאריך",
        start_time: "שעת התחלה",
        end_time: "שעת סיום",
        my_requests: "הבקשות האחרונות שלי",
        no_requests: "לא נמצאו בקשות.",
        choose_default_site: "מאיפה אתה עובד?",
        remember_site: "האתר יישמר כאתר ברירת המחדל שלך.",
        admin_dashboard: "לוח מנהלים",
        active_workers: "עובדים פעילים - זמן אמת",
        pending_requests: "בקשות הגעה ממתינות",
        attendance_logs: "יומן נוכחות",
        user: "משתמש",
        action: "פעולה",
        site: "אתר",
        time: "זמן",
        approve: "אישור",
        reject: "דחייה",
        all_sites: "כל האתרים",
        filter_date: "סנן תאריך",
        filter_site: "סנן אתר",
        status: "סטטוס נוכחי",
        since: "מאז",
        profile: "פרופיל אישי",
        update_profile: "עדכון פרופיל",
        save_changes: "שמירת שינויים",
        on_site: "נמצא כעת באתר",
        off_site: "מחוץ לאתר",
        manage_users: "ניהול משתמשים",
        role: "תפקיד",
        make_admin: "הפוך למנהל",
        make_user: "הפוך למשתמש",
        total_headcount: "סה״כ נוכחים",
        change_password: "שינוי סיסמה",
        current_password: "סיסמה נוכחית",
        new_password: "סיסמה חדשה",
        reset_password: "איפוס סיסמה",
        must_change_password: "עליך להחליף את הסיסמה שלך כדי להמשיך להשתמש במערכת."
    }
};

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState('he');

    useEffect(() => {
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    const toggleLang = (newLang) => {
        setLang(newLang);
    };

    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
