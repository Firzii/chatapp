# ChatApp

A real-time chat application built with React Native and Firebase.

## Features

- 🔐 Email/Password Authentication
- 💬 Real-time messaging with Firestore
- 📱 Offline message storage
- 📷 Image upload and sharing
- 🔄 Auto-login with session persistence

## Tech Stack

- React Native 0.82.1
- Firebase (Firestore, Authentication, Storage)
- React Navigation
- AsyncStorage
- React Native Image Picker

## Getting Started

### Prerequisites

- Node.js v22.17.1 or higher
- React Native development environment setup
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository:
```sh
git clone https://github.com/Firzii/chatapp.git
cd chatapp
```

2. Install dependencies:
```sh
npm install
```

3. Install iOS dependencies (iOS only):
```sh
bundle install
bundle exec pod install
```

4. Create `firebase.ts` with your Firebase configuration

5. Run the app:

**Android:**
```sh
npm run android
```

**iOS:**
```sh
npm run ios
```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Firebase Storage
5. Download `google-services.json` (Android) and place it in `android/app/`
6. Update `firebase.ts` with your Firebase configuration

## Project Structure

```
ChatApp/
├── screens/
│   ├── RegisterScreen.tsx    # Authentication screen
│   └── ChatScreen.tsx         # Main chat interface
├── firebase.ts                # Firebase configuration
├── App.tsx                    # Navigation setup
└── android/ios/              # Native code
```

## License

MIT
