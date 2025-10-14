import 'dart:convert';
import 'package:http/http.dart' as http;

/// Set at run time:
/// flutter run -d "iPhone 15" --dart-define=BASE_URL=http://192.168.0.47:3001
const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://127.0.0.1:3001', // placeholder
);

class ApiClient {
    static Future<Map<String, dynamic>> health() async {
        final uri = Uri.parse('$baseUrl/api/health');
        final res = await http.get(uri);
        if (res.statusCode != 200) {
            throw Exception('HTTP ${res.statusCode}: ${res.body}');
        }
        return jsonDecode(res.body) as Map<String, dynamic>;
    }
}