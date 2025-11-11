import VerifyEmail from "../../pages/VerifyEmailPage.js";
import "../../css/palettes.css";
import { Suspense } from 'react';

export default function Home() {
    return (
        <div className="theme-blue">
            <Suspense>
                <VerifyEmail />
            </Suspense>
        </div>
    );
}