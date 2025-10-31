# frontend_ios

A new Flutter project.

## Folder Description

ios/                    # Where the ios native code goes

lib/                    # Where most of the flutter programming will be done
├── main.dart           # The app's entry point
│
├── core/               # Shared code used by all features
│   ├── api/            # The ApiService class for all HTTP requests
│   ├── models/         # Data classes (e.g., User, Envelope, Account)
│   ├── providers/      # State management (e.g., AuthProvider, EnvelopeProvider)
│   └── widgets/        # Reusable UI widgets (e.g., CustomButton, FormField)
│
└── features/           # All app screens and their specific logic
    ├── auth/           # Login, Register, Forgot Password screens
    ├── dashboard/      # The main dashboard screen
    ├── envelopes/      # Envelopes list, detail, and create/edit screens
    ├── accounts/       # Accounts management screen
    └── settings/       # Settings screen

## IMPORTANT!!
When testing the app on local, I had to add this:
```bash
    <key>NSAppTransportSecurity</key>
        <dict>
            <key>NSAllowsArbitraryLoads</key>
            <true/>
        </dict>
```
to Info.plist in /ios/Runner to allow this app to send requests via http rather than https.
-> When we get a secure url with https, delete this bit!