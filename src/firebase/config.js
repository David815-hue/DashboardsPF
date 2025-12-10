import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB4K11XyTidiiiuGHRWL0AaBk1zne1TCOg",
    authDomain: "dashboardpf-137e2.firebaseapp.com",
    projectId: "dashboardpf-137e2",
    storageBucket: "dashboardpf-137e2.firebasestorage.app",
    messagingSenderId: "1028433772044",
    appId: "1:1028433772044:web:42d43c30b505607446f829"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
