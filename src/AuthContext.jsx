// ══════════════════════════════════════════════════════════════
//  Authentication Context
//  ──────────────────────────────────────────────────────────────
//  Role hierarchy: admin > manager > staff
//  Admin is pre-made (set ADMIN_EMAIL in firebase.js)
//  Manager & Staff can self-register
// ══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
} from "firebase/auth";
import { auth, ADMIN_EMAIL } from "./firebase";
import { createUserProfile, getUserProfile } from "./db";

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    let profile = await getUserProfile(firebaseUser.uid);
                    // Auto-create admin profile on first login
                    if (!profile && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                        await createUserProfile(firebaseUser.uid, {
                            name: firebaseUser.displayName || "Admin",
                            email: firebaseUser.email,
                            role: "admin",
                        });
                        profile = await getUserProfile(firebaseUser.uid);
                    }
                    setUserProfile(profile);
                } catch (err) {
                    console.error("Error fetching user profile:", err);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        let profile = await getUserProfile(cred.user.uid);

        if (!profile && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            await createUserProfile(cred.user.uid, {
                name: cred.user.displayName || "Admin",
                email,
                role: "admin",
            });
            profile = await getUserProfile(cred.user.uid);
        }

        if (!profile) {
            await signOut(auth);
            throw new Error("No profile found. Please create an account first.");
        }

        setUserProfile(profile);
        return cred;
    };

    const register = async (name, email, password, role = "staff") => {
        const safeRole = ["manager", "staff"].includes(role) ? role : "staff";
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await createUserProfile(cred.user.uid, { name, email, role: safeRole });
        const profile = await getUserProfile(cred.user.uid);
        setUserProfile(profile);
        return cred;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    const value = {
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        isAdmin: userProfile?.role === "admin",
        isManager: userProfile?.role === "manager",
        isStaff: userProfile?.role === "staff",
        canManageEvents: ["admin", "manager"].includes(userProfile?.role),
        canManageUsers: userProfile?.role === "admin",
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
