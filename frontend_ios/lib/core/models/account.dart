class Account {
  final String id;
  final String name;
  final String? officialName;
  final String? mask;
  final String type;
  final String subtype;
  final double balanceCurrent; // Plaid sends this as a double
  bool tracking; // This is the important part

  Account({
    required this.id,
    required this.name,
    this.officialName,
    this.mask,
    required this.type,
    required this.subtype,
    required this.balanceCurrent,
    required this.tracking,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unnamed Account',
      officialName: json['official_name'] as String?,
      mask: json['mask'] as String?,
      type: json['type'] as String? ?? '',
      subtype: json['subtype'] as String? ?? '',
      balanceCurrent: (json['balance_current'] as num? ?? 0).toDouble(),
      tracking: json['tracking'] as bool? ?? false,
    );
  }

  // Helper to format the balance
  String get formattedBalance {
    return '\$${balanceCurrent.toStringAsFixed(2)}';
  }
}