// In lib/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final apiService = ApiService();

  String? errorMessage;

  // Dispose of controllers when the screen is closed
  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
              controller: nameController,
              decoration: InputDecoration(
                labelText: 'Name',
              ),
            ),
            SizedBox(height: 20),
            TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: 'Email',
              ),
            ),
            SizedBox(height: 20),
            TextField(
              controller: passwordController,
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
            if (errorMessage != null) ...[
              SizedBox(height: 10),
              Text(
                errorMessage!,
                style: TextStyle(color: Colors.red),
              ),
            ],
            SizedBox(height: 100),
            ElevatedButton(
              onPressed: () async {
                setState(() {
                  errorMessage = null; // Clear previous error message
                });

                // Get the text from the fields
                final name = nameController.text;
                final email = emailController.text;
                final password = passwordController.text;

                // Call your API service!
                String? registerStatus = await apiService.register(
                  email: email,
                  password: password,
                  name: name,
                  timezone: "America/New_York", // You can get this from the device
                  currency: "USD"
                );
                if (registerStatus == "success" && mounted) {
                  Navigator.pop(context);
                  print("Registered with $email");
                } else {
                  setState(() {
                    errorMessage = registerStatus; // Show error message
                  });
                  print("Register failed for $email");
                  print("Error: $registerStatus");
                }
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