// In lib/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:frontend_ios/features/nav_background_screen.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/features/auth/register_screen.dart';
import 'package:frontend_ios/features/auth/forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final apiService = ApiService();

  String? errorMessage; 

  // Dispose of controllers when the screen is closed
  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("BΰDGIE"),
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
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
                );
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
                final email = emailController.text;
                final password = passwordController.text;

                // Wait for api service
                String? loginStatus = await apiService.login(email, password);
                if (loginStatus == "success" && mounted) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => const NavBkgrdScreen()),
                  );
                  // print("Logined in with $email");
                } else {
                  setState(() {
                    errorMessage = loginStatus; // Show error message
                  });
                  // print("Login failed for $email");
                  // print("Error: $loginStatus");
                }
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