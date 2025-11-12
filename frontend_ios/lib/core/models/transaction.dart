import 'package:flutter/material.dart';

class Transaction {
  final String id;
  final String name;
  final String merchantName;
  final int amountCents;
  final DateTime postedAt;
  final int allocated;
  final bool fromAccountTracking; // This is our special transaction
  final List<String> category;

  Transaction({
    required this.id,
    required this.name,
    required this.merchantName,
    required this.amountCents,
    required this.postedAt,
    required this.allocated,
    required this.fromAccountTracking,
    required this.category,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      // name can be null
      name: json['name'] as String? ?? '',
      merchantName: json['merchant_name'] as String? ?? '',
      amountCents: (json['amount_cents'] as num? ?? 0).toInt(),
      postedAt: DateTime.tryParse(json['posted_at'] as String? ?? '') ?? DateTime.now(),
      allocated: (json['allocated'] as num? ?? 0).toInt(),
      fromAccountTracking: json['from_account_tracking'] as bool? ?? false,
      category: List<String>.from((json['category'] as List<dynamic>? ?? [])),
    );
  }

  /// The unallocated portion of the transaction (can be positive or negative)
  int get unallocatedCents => amountCents - allocated;
  
  /// Is the transaction fully allocated?
  bool get isFullyAllocated => unallocatedCents == 0;

  // This helper will now prioritize the 'name' field
  String get displayName {
    // 1. Use the 'name' field first (e.g., "Account: Chase (Balance Added)")
    if (name.isNotEmpty) return name; 
    
    // 2. Fallback to merchant name for regular transactions
    if (merchantName.isNotEmpty) return merchantName;
    
    // 3. Fallback for any old/other types
    if (fromAccountTracking) {
      return "Account Balance Update"; 
    }
    return "Unknown Transaction";
  }

  // Helper to format the currency
  String get formattedAmount {
    final double amountDollars = amountCents / 100.0;
    // Show a '+' for positive amounts (inflows)
    if (amountDollars > 0) {
      return '+\$${amountDollars.toStringAsFixed(2)}';
    }
    // Handle negative zero for display
    if (amountDollars == 0.0) {
       return '\$0.00';
    }
    return '\$${amountDollars.toStringAsFixed(2)}';
  }

  // Helper to format the date
  String get formattedDate {
    // You can use the 'intl' package for better formatting like 'MMM d, yyyy'
    return "${postedAt.month}/${postedAt.day}/${postedAt.year}";
  }
}