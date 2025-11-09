class Envelope {
  Envelope({
    required this.id,
    required this.name,
    required this.amount,
    this.order,
    this.monthlyTarget,
    this.color,
    this.createdAt,
    this.description,
  });

  final String id;
  final String name;
  final int amount;
  final int? order;
  final int? monthlyTarget;
  final String? color;
  final DateTime? createdAt;
  final String? description;

  factory Envelope.fromJson(Map<String, dynamic> json) {
    return Envelope(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      amount: _asInt(json['amount']) ?? 0,
      monthlyTarget: _asInt(json['monthly_target']),
      order: _asInt(json['order']),
      color: json['color'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      description: json['description'] as String?,
    );
  }

  static int? _asInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}
