import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import LoginPage from "../pages/LoginPage";

export default function Home() {
    const cookieStore = cookies();
    const session = cookieStore.get("session_id");
    if (session) redirect("/dashboard");

    return (
        <LoginPage />
    );
}
