import 'package:flutter/material.dart';
import 'package:frontend_ios/features/auth/login_screen.dart'; 

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Budget App',
      theme: ThemeData(
        // You can add your app's colors here later
        primarySwatch: Colors.blue,
      ),
      home: LoginScreen(), // This is the first screen your app will show
    );
  }
}