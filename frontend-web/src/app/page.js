"use client"

import { useEffect, useState } from "react";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/api/health", {
      method: "GET",
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.msg))
      .catch((err) => {
        console.error(err);
        setHealthStatus("Error connecting to backend.");
      });
  }, []);


  return (
    <html lang="en">
      <head>
        <title>MERN Project</title>
        <meta charSet="UTF-8" />
      </head>
      <body style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <h1>Frontend Connected</h1>
        <p>Backend health check:</p>
        <pre
          style={{
            background: "#f4f4f4",
            padding: "10px",
            borderRadius: "4px",
            overflowX: "auto",
          }}
        >
          {healthStatus}
        </pre>
      </body>
    </html>
  );
}
