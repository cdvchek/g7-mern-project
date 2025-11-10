import 'dart:convert';

import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/core/models/transfer.dart';
import 'package:frontend_ios/core/models/user.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  ApiService();

  static const _cookieKey = 'cookie';
  static const _accessTokenKey = 'accessToken';
  static const _refreshTokenKey = 'refreshToken';
  static const _accessExpiresKey = 'accessTokenExpiresAt';
  static const _refreshExpiresKey = 'refreshTokenExpiresAt';

  // Replace with your computer's IP address and backend port
  // (Do NOT use localhost, your phone simulator can't see it)
  final String _baseUrl = 'http://100.70.152.25:3001'; // for local

  Future<void> saveCookie(http.Response response) async {
    final String? rawCookie = response.headers['set-cookie'];
    if (rawCookie == null) return;
    final String cookie = rawCookie.split(';')[0];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cookieKey, cookie);
  }

  Future<Map<String, String>> getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final cookie = prefs.getString(_cookieKey);
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };

    if (cookie != null && cookie.isNotEmpty) {
      headers['cookie'] = cookie;
    }

    final token = await _getValidAccessToken(prefs);
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  Future<String?> login(String email, String password) async {
    final url = Uri.parse('$_baseUrl/api/auth/login');
    try {
      final response = await http.post(
        url,
        headers: const {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        await _persistSession(body);
        await saveCookie(response);
        return 'success';
      }

      final decoded = _tryDecode(response.body);
      return decoded['error']?.toString() ?? 'Login failed';
    } catch (e) {
      return e.toString();
    }
  }

  Future<String> register({
    required String email,
    required String password,
    String? name,
    String? timezone,
    String? currency,
  }) async {
    final url = Uri.parse('$_baseUrl/api/auth/register');

    try {
      final response = await http.post(
        url,
        headers: const {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': name,
          'timezone': timezone,
          'currency': currency,
        }),
      );

      if (response.statusCode == 201) {
        await saveCookie(response);
        return 'success';
      }

      final decoded = _tryDecode(response.body);
      return decoded['error']?.toString() ?? 'Registration failed';
    } catch (e) {
      return e.toString();
    }
  }

  Future<String> requestPasswordReset(String email) async {
    final Uri requestResetUri = Uri.parse("$_baseUrl/api/auth/forgot-password");

    try {
      final response = await http.post(
        requestResetUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
        }),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 && body['ok'] == true) {
        // Return the success message from the server
        return body['message'] ?? "Password reset link sent.";
      } else {
        // If the server sends an error, throw it
        throw (body['message'] ?? "Failed to request reset.");
      }
    } catch (e) {
      // Re-throw the error to be caught by the ForgotPasswordScreen
      throw Exception(e.toString());
    }
  }

  Future<void> logout() async {
    final url = Uri.parse('$_baseUrl/api/auth/logout');

    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString(_refreshTokenKey);
      await http.post(
        url,
        headers: const {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
    } finally {
      await _clearSession();
    }
  }

  Future<User?> getUser() async {
    final url = Uri.parse('$_baseUrl/api/auth/me');

    try {
      final headers = await getAuthHeaders();
      final response = await http.post(url, headers: headers);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return User.fromJson(body['user']);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  Future<String?> updateUser({
    String? name,
    String? email,
    String? timezone,
    String? currency,
    required String password,
  }) async {
    final url = Uri.parse('$_baseUrl/api/auth/me');
    try {
      final headers = await getAuthHeaders();
      final Map<String, dynamic> body = {'password': password};
      if (name != null) body['name'] = name;
      if (email != null) body['email'] = email;
      if (timezone != null) body['timezone'] = timezone;
      if (currency != null) body['currency'] = currency;

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return 'success';
      }
      final decoded = _tryDecode(response.body);
      return decoded['error']?.toString();
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> getAccounts() async {
    final url = Uri.parse('$_baseUrl/api/accounts');
    try {
      final headers = await getAuthHeaders();
      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        return;
      }
      print('Failed to get accounts: ${response.body}');
    } catch (e) {
      print('Error getting accounts: $e');
    }
  }

  Future<List<Envelope>> fetchEnvelopes() async {
    final url = Uri.parse('$_baseUrl/api/envelopes/get');

    try {
      final headers = await getAuthHeaders();
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List<dynamic>;
        return data
            .map((item) => Envelope.fromJson(item as Map<String, dynamic>))
            .toList();
      }

      if (response.statusCode == 401) {
        throw Exception('Session expired. Please sign in again.');
      }

      final decoded = _tryDecode(response.body);
      throw Exception(decoded['error'] ?? 'Failed to load envelopes');
    } catch (e) {
      throw Exception('Failed to load envelopes: $e');
    }
  }

  Future<Envelope> createEnvelope({
    required String name,
    required int monthlyTarget,
    required String colorHex,
    int order = 0,
    String description = '',
  }) async {
    final url = Uri.parse('$_baseUrl/api/envelopes/post');

    try {
      final headers = await getAuthHeaders();
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'name': name,
          'monthly_target': monthlyTarget,
          'color': colorHex,
          'order': order,
          'description': description,
        }),
      );

      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};

      if (response.statusCode == 200) {
        return Envelope.fromJson(body);
      }
      if (response.statusCode == 401) {
        throw Exception('Session expired. Please sign in again.');
      }
      throw Exception(body['error']?.toString() ?? 'Failed to create envelope');
    } catch (e) {
      throw Exception('Failed to create envelope: $e');
    }
  }

  Future<Envelope> updateEnvelope({
    required String id,
    String? name,
    int? monthlyTarget,
    String? colorHex,
    String? description,
    int? order,
  }) async {
    final url = Uri.parse('$_baseUrl/api/envelopes/put/$id');

    try {
      final headers = await getAuthHeaders();
      final Map<String, dynamic> payload = {};
      if (name != null) payload['name'] = name;
      if (monthlyTarget != null) payload['monthly_target'] = monthlyTarget;
      if (colorHex != null) payload['color'] = colorHex;
      if (description != null) payload['description'] = description;
      if (order != null) payload['order'] = order;

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(payload),
      );

      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};

      if (response.statusCode == 200) {
        return Envelope.fromJson(body);
      }
      if (response.statusCode == 401) {
        throw Exception('Session expired. Please sign in again.');
      }
      throw Exception(body['error']?.toString() ?? 'Failed to update envelope');
    } catch (e) {
      throw Exception('Failed to update envelope: $e');
    }
  }

  Future<void> deleteEnvelope(String id) async {
    final url = Uri.parse('$_baseUrl/api/envelopes/delete/$id');

    try {
      final headers = await getAuthHeaders();
      final response = await http.delete(url, headers: headers);

      if (response.statusCode == 200) {
        return;
      }
      if (response.statusCode == 401) {
        throw Exception('Session expired. Please sign in again.');
      }
      final body = _tryDecode(response.body);
      throw Exception(body['error']?.toString() ?? 'Failed to delete envelope');
    } catch (e) {
      throw Exception('Failed to delete envelope: $e');
    }
  }

  Future<TransferActionResult> transferFunds({
    required String fromEnvelopeId,
    required String toEnvelopeId,
    required int amount,
    String? notes,
  }) async {
    final url = Uri.parse('$_baseUrl/api/transfers');

    try {
      final headers = await getAuthHeaders();
      final payload = <String, dynamic>{
        'from_envelope_id': fromEnvelopeId,
        'to_envelope_id': toEnvelopeId,
        'amount': amount,
      };
      if (notes != null && notes.trim().isNotEmpty) {
        payload['notes'] = notes.trim();
      }

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(payload),
      );

      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};

      if (response.statusCode == 201) {
        return TransferActionResult.fromJson(body);
      }
      if (response.statusCode == 401) {
        throw Exception('Session expired. Please sign in again.');
      }
      throw Exception(body['error']?.toString() ?? 'Failed to transfer funds');
    } catch (e) {
      throw Exception('Failed to transfer funds: $e');
    }
  }

  Future<List<Transfer>> fetchTransfersForEnvelope(String envelopeId) async {
    final transfers = await _fetchAllTransfers();

    final filtered = transfers
        .where((transfer) =>
            transfer.fromEnvelope.id == envelopeId || transfer.toEnvelope.id == envelopeId)
        .toList();

    filtered.sort((a, b) {
      final aDate = a.createdAt ?? a.occuredAt;
      final bDate = b.createdAt ?? b.occuredAt;
      if (aDate == null && bDate == null) return 0;
      if (aDate == null) return 1;
      if (bDate == null) return -1;
      return bDate.compareTo(aDate);
    });

    return filtered;
  }

  Future<List<Transfer>> _fetchAllTransfers() async {
    try {
      final headers = await getAuthHeaders();
      final url = Uri.parse('$_baseUrl/api/transfers');
      final response = await http.get(url, headers: headers);
      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};

      if (response.statusCode == 200) {
        final rawTransfers = body['transfers'] as List<dynamic>? ?? const <dynamic>[];
        return rawTransfers
            .map((item) => Transfer.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      if (response.statusCode == 401) {
        throw Exception('Session expired. Please sign in again.');
      }
      throw Exception(body['error']?.toString() ?? 'Failed to load transfers');
    } catch (e) {
      throw Exception('Failed to load transfers: $e');
    }
  }

  Map<String, dynamic> _tryDecode(String raw) {
    if (raw.isEmpty) return <String, dynamic>{};
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  Future<void> _persistSession(Map<String, dynamic> body) async {
    final prefs = await SharedPreferences.getInstance();
    final accessToken = body['accessToken'] as String?;
    final refreshToken = body['refreshToken'] as String?;
    final accessExpires = _normalizeExpiryMillis(
      absolute: body['accessTokenExpiresAt'],
      relativeSeconds: body['accessTokenExpiresIn'],
    );
    final refreshExpires = _normalizeExpiryMillis(
      absolute: body['refreshTokenExpiresAt'],
      relativeSeconds: body['refreshTokenExpiresIn'],
    );

    if (accessToken != null) {
      await prefs.setString(_accessTokenKey, accessToken);
    }
    if (refreshToken != null) {
      await prefs.setString(_refreshTokenKey, refreshToken);
    }
    if (accessExpires != null) {
      await prefs.setInt(_accessExpiresKey, accessExpires);
    }
    if (refreshExpires != null) {
      await prefs.setInt(_refreshExpiresKey, refreshExpires);
    }
  }

  Future<void> _clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_cookieKey);
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_accessExpiresKey);
    await prefs.remove(_refreshExpiresKey);
  }

  Future<String?> _getValidAccessToken(SharedPreferences prefs) async {
    final token = prefs.getString(_accessTokenKey);
    final expiresAt = prefs.getInt(_accessExpiresKey);
    final now = DateTime.now().millisecondsSinceEpoch + 5000;

    if (token != null && expiresAt != null && expiresAt > now) {
      return token;
    }

    final refreshed = await _refreshAccessToken(prefs);
    if (refreshed != null && refreshed.isNotEmpty) {
      return refreshed;
    }

    throw Exception('Session expired. Please sign in again.');
  }

  Future<String?> _refreshAccessToken(SharedPreferences prefs) async {
    final refreshToken = prefs.getString(_refreshTokenKey);
    if (refreshToken == null || refreshToken.isEmpty) {
      return null;
    }

    final url = Uri.parse('$_baseUrl/api/auth/refresh');
    final response = await http.post(
      url,
      headers: const {'Content-Type': 'application/json; charset=UTF-8'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );

    if (response.statusCode == 200) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      await _persistSession(body);
      return body['accessToken'] as String?;
    }

    await _clearSession();
    throw Exception('Session expired. Please sign in again.');
  }

  int? _normalizeExpiryMillis({dynamic absolute, dynamic relativeSeconds}) {
    if (absolute is num) {
      return absolute.toInt();
    }
    if (relativeSeconds is num) {
      final now = DateTime.now().millisecondsSinceEpoch;
      return now + (relativeSeconds * 1000).round();
    }
    return null;
  }
}
