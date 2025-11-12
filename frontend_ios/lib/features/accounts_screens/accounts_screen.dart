import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/account.dart';
import 'package:frontend_ios/core/models/bank.dart';

class BankAccountsScreen extends StatefulWidget {
  final BankConnection bank;

  const BankAccountsScreen({super.key, required this.bank});

  @override
  State<BankAccountsScreen> createState() => _BankAccountsScreenState();
}

class _BankAccountsScreenState extends State<BankAccountsScreen> {
  final ApiService _apiService = ApiService();
  
  // Use a state variable instead of a Future in the builder
  // This allows us to modify the list during optimistic updates
  List<Account> _accounts = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  Future<void> _loadAccounts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final accounts = await _apiService.fetchAccountsForBank(widget.bank.itemId);
      if (mounted) {
        setState(() {
          _accounts = accounts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  String _formatBalance(double balance) {
    return '\$${balance.toStringAsFixed(2)}';
  }

  Future<void> _onTrackChanged(Account account, bool isTracking) async {
    // Find the account's index in our state list
    final int index = _accounts.indexWhere((a) => a.id == account.id);
    if (index == -1) return; // Should not happen

    // Save the old tracking state in case we need to roll back
    final bool oldTrackingState = account.tracking;

    // Optimistic UI update: update the state immediately
    setState(() {
      _accounts[index].tracking = isTracking;
    });

    try {
      // --- THIS IS THE UPDATED CALL ---
      // We now pass the bank's itemId, which is required by your backend
      final updatedAccount = await _apiService.updateAccountTracking(
        accountId: account.id,
        isTracking: isTracking,
        itemId: widget.bank.itemId, // Pass the bank's item ID
      );

      // Success: replace the local account with the new one from the server
      if (mounted) {
        setState(() {
          _accounts[index] = updatedAccount;
        });
      }
    } catch (e) {
      // Rollback on error
      if (mounted) {
        setState(() {
          _accounts[index].tracking = oldTrackingState; // Revert to old state
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error: ${e.toString().replaceFirst('Exception: ', '')}"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext ctxt) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.bank.institutionName} Accounts"),
        // ... (your app bar actions) ...
      ),
      body: _buildBody(), // Use a helper for cleaner build method
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text(
            _errorMessage!,
            style: TextStyle(color: Colors.red, fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    if (_accounts.isEmpty) {
      return Center(
        child: Text("No accounts found for this bank."),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _accounts.length,
      itemBuilder: (context, index) {
        final account = _accounts[index];
        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: SwitchListTile(
              title: Text(
                account.name,
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                "${account.type} (${account.mask})\nBalance: ${account.formattedBalance}",
              ),
              value: account.tracking,
              onChanged: (isTracking) {
                _onTrackChanged(account, isTracking);
              },
              secondary: Icon(
                Icons.account_balance,
                color: Theme.of(context).primaryColor,
              ),
              isThreeLine: true,
            ),
          ),
        );
      },
    );
  }
}