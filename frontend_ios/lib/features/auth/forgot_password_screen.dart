import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart'; // Assuming ApiService is here

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final emailController = TextEditingController();
  final apiService = ApiService();

  String? message;
  bool isLoading = false;
  bool isSuccess = false; // To change message color

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  // This function will call your backend to request a password reset link.
  Future<void> _requestResetLink() async {
    if (isLoading) return;

    setState(() {
      isLoading = true;
      message = null;
      isSuccess = false;
    });

    try {
      final responseMessage = await apiService.requestPasswordReset(emailController.text);

      setState(() {
        isLoading = false;
        message = responseMessage;
        isSuccess = true; // Show success message in green
      });

    } catch (e) {
      setState(() {
        isLoading = false;
        message = e.toString(); // Show error message in red
        isSuccess = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("BΰDGIE"),
        // Automatically adds a back button to return to Login
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Placeholder for your logo, like the "Sign In" text
            Text(
              "Reset Password",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 15),
            Text(
              "Please enter your email to receive a password reset link",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey[700]),
            ),
            SizedBox(height: 30),
            
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Email',
              ),
            ),
            SizedBox(height: 20),

            // Message display for success or error
            if (message != null) ...[
              Text(
                message!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isSuccess ? Colors.green : Colors.red,
                  fontSize: 14
                ),
              ),
              SizedBox(height: 20),
            ],
            
            ElevatedButton(
              // Using the default ElevatedButton style to match your login
              onPressed: _requestResetLink,
              child: isLoading
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text('SEND RESET LINK'),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                // Navigate back to the login screen
                Navigator.pop(context);
              },
              child: Text("Return to Login"),
            ),
          ],
        ),
      ),
    );
  }
}