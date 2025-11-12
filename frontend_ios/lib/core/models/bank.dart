class BankConnection {
  final String id;
  final String itemId;
  final String institutionName;

  BankConnection({
    required this.id,
    required this.itemId,
    required this.institutionName,
  });

  factory BankConnection.fromJson(Map<String, dynamic> json) {
    return BankConnection(
      id: json['id'] as String? ?? '',
      itemId: json['item_id'] as String? ?? '',
      institutionName: json['institution_name'] as String? ?? 'Unknown Bank',
    );
  }
}