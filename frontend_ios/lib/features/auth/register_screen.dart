// In lib/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final nameController = TextEditingController();
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
            Text("Create an Account", 
              style: 
                TextStyle(fontSize: 24,)),
            SizedBox(height: 30),
            TextField(
              decoration: InputDecoration(
                labelText: 'Name',
              ),
            ),
            SizedBox(height: 20),
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
                final name = nameController.text;
                final email = emailController.text;
                final password = passwordController.text;

                // Call your API service!
                apiService.register(
                  email: email,
                  password: password,
                  name: name,
                  timezone: "America/New_York", // You can get this from the device
                  currency: "USD"
                );
                print("Register button pressed!");
              },
              child: Text('Sign Up'),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                // Pushed register screen over login, so just pop to go back
                Navigator.pop(context);
              },
              child: Text("Already have an account? Login"),
            ),
          ],
        ),
      ),
    );
  }
}