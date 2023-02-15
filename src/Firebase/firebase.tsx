import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "cabraiz.firebaseapp.com",
  projectId: "cabraiz",
  storageBucket: "cabraiz.appspot.com",
  messagingSenderId: "223470266905",
  appId: "1:223470266905:web:d6b545f72e039d53769888",
  measurementId: "G-X86XGVXD4C",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
