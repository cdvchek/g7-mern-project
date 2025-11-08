class User {
  final String id;
  final String email;
  final String? name;
  final String? timezone;
  final String? currency;
  final bool isEmailVerified;

  User({
    required this.id,
    required this.email,
    this.name,
    this.timezone,
    this.currency,
    required this.isEmailVerified,
  });

  // Create a User object from JSON data
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      timezone: json['timezone'],
      currency: json['currency'],
      isEmailVerified: json['isEmailVerified'] ?? false,
    );
  }
}