// In lib/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/features/auth/register_screen.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    final apiService = ApiService(); // Create an instance

    return Scaffold(
      appBar: AppBar(
        title: Text("Our Budgeting App"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your App Logo would go here
            Text("Sign In", 
              style: 
                TextStyle(fontSize: 24,)),
            SizedBox(height: 30),
            TextField(
              decoration: InputDecoration(
                labelText: 'Email',
              ),
            ),
            SizedBox(height: 20),
            TextField(
              obscureText: true, // This hides the password
              decoration: InputDecoration(
                labelText: 'Password',
              ),
            ),
            SizedBox(height: 20),
            TextButton(
              onPressed: () { 
                // TODO: Navigate to Forgot Password Screen
              },
              child: Text("Forgot Password?"),
            ),
            SizedBox(height: 100),
            ElevatedButton(
              onPressed: () {
                // Get the text from the fields
                final email = emailController.text;
                final password = passwordController.text;

                // Call your API service!
                apiService.login(email, password);
                print("Login button pressed!");
              },
              child: Text('Login'),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context, 
                  MaterialPageRoute(builder: (context) => const RegisterScreen())
                );
              },
              child: Text("Don't have an account? Register"),
            ),
          ],
        ),
      ),
    );
  }
}