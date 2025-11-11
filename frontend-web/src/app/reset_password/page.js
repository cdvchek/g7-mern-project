import ResetPassword from "../../pages/ResetPasswordPage.js";
import "../../css/palettes.css";
import { Suspense } from 'react';

export default function Home() {
    return (
        <div className="theme-blue">
            <Suspense>
                <ResetPassword />
            </Suspense>
        </div>
    );
}