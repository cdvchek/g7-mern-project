// In lib/core/api/api_service.dart
import 'dart:ffi';

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Replace with your computer's IP address and backend port
  // (Do NOT use localhost, your phone simulator can't see it)
  final String _baseUrl = 'http://100.70.152.25:3001'; // for local

  // Helper function to save the cookie
  Future<void> saveCookie(http.Response response) async {
    final String? rawCookie = response.headers['set-cookie'];
    if (rawCookie != null) {
      // The cookie is usually the first part of the string
      final String cookie = rawCookie.split(';')[0];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cookie', cookie);
      print('Cookie saved: $cookie');
    }
  }

  // Helper function to get the cookie
  Future<Map<String, String>> getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final String? cookie = prefs.getString('cookie');

    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'cookie': cookie ?? '', // Send the saved cookie
    };
  }

  // This is the Dart function that calls your Node.js route
  Future<String?> login(String email, String password) async {
    // This path matches your backend API spec 
    final url = Uri.parse('$_baseUrl/api/auth/login');

    try {
      final response = await http.post(
        url,
        headers: {
          // This tells your backend you're sending JSON
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode({
          // This becomes the `req.body` in your Node.js code
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        // Success! The backend sent back the user.
        final body = jsonDecode(response.body);
        final user = body['user'];
        // Save the session cookie
        await saveCookie(response);
        print('Login successful! User: $user');
        return "success";
      } else {
        // Handle errors like 401 'Invalid credentials'
        final error = jsonDecode(response.body)['error'];
        print('Login failed: $error');
        return error;
      }
    } catch (e) {
      // Handle network errors (e.g., server is off)
      print('An error occurred: $e');
      return e.toString();
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    String? name,
    String? timezone,
    String? currency,
  }) async {
    // This path matches your backend API spec
    final url = Uri.parse('$_baseUrl/api/auth/register');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode({
          // This becomes the `req.body` in your Node.js code
          'email': email,
          'password': password,
          'name': name,
          'timezone': timezone,
          'currency': currency,
        }),
      );

      // Your backend returns 201 on success
      if (response.statusCode == 201) {
        // Success! The backend sent back the new user.
        final body = jsonDecode(response.body);
        final user = body['user'];
        // Save the session cookie
        await saveCookie(response);
        print('Registration successful! User: $user');
        return true;
      } else {
        // Handle errors like 409 'Email already in use'
        final error = jsonDecode(response.body)['error'];
        print('Registration failed: $error');
        // TODO: Show this error to the user
      }
    } catch (e) {
      // Handle network errors (e.g., server is off)
      print('An error occurred: $e');
    }
    return false;
  }

  Future<void> logout() async {
  // Your index.js file routes this to /api/auth/logout
  // Change this if the route in logoutRoute.js changes to "/" instead of "/logout"
  final url = Uri.parse('$_baseUrl/api/auth/logout/logout');
  
  try {
    final headers = await getAuthHeaders();
    
    // 2. Make the POST request to destroy the server session
    final response = await http.post(
      url,
      headers: headers,
    );

    if (response.statusCode == 200) {
      print('Server logout successful');
    } else {
      print('Server logout failed: ${response.body}');
    }
  } catch (e) {
    // Catch any network errors
    print('An error occurred during logout: $e');
  } finally {
    // Clear the local cookie, even if the server call fails to ensure the user is logged out of the app
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cookie');
    print('Local cookie cleared.');
  }
}

  /*  May need to change later! */
  Future<void> getAccounts() async {
  final url = Uri.parse('$_baseUrl/api/accounts');
  
  try {
    // Add the auth headers with the cookie
    final headers = await getAuthHeaders();
    final response = await http.get(url, headers: headers);
    
    if (response.statusCode == 200) {
      print('Got accounts! ${response.body}');
      // TODO: Decode the JSON and return the list of accounts
    } else {
      print('Failed to get accounts: ${response.body}');
      // This will probably be a 401 Unauthorized if your cookie is wrong
    }
    
  } catch (e) {
    print('Error getting accounts: $e');
  }
}
}