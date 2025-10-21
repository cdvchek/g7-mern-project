import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import "../css/palettes.css"
import LoginPage from "../pages/LoginPage";

export default function Home() {
    const cookieStore = cookies();
    const session = cookieStore.get("session_id");
    if (session) redirect("/dashboard");

    return (
        <div className="theme-blue">
            <LoginPage />
        </div>
    );
}
