import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/core/models/transaction.dart';
import 'package:frontend_ios/features/transactions_screens/allocate_transaction_screen.dart';
import 'package:intl/intl.dart';

// Enum for filtering
enum TransactionFilter { all, toAllocate, toDeallocate }

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final ApiService _apiService = ApiService();

  List<Transaction> _allTransactions = []; // Holds all transactions
  List<Transaction> _filteredTransactions = []; // Holds what's visible  
  int _totalBalanceCents = 0;
  int _availableToAllocateCents = 0;
  int _availableToDeallocateCents = 0; 
  bool _isLoading = true;
  String? _errorMessage;

  TransactionFilter _filter = TransactionFilter.all; 

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
       // We fetch envelopes AND transactions
      final results = await Future.wait([
        _apiService.fetchEnvelopes(),
        _apiService.fetchTransactions(),
      ]);

      final envelopes = results[0] as List<Envelope>;
      final transactions = results[1] as List<Transaction>;

      // Calculate total allocated (money in envelopes)
      int totalAllocatedCents = 0;
      for (final env in envelopes) {
        totalAllocatedCents += env.amount;
      }

      // Calculate unallocated totals
      int availableCents = 0;
      int deallocateCents = 0;
      int totalUnallocatedCents = 0; // For total balance

      for (final tx in transactions) {
        final unallocated = tx.unallocatedCents; // Use our new helper
        totalUnallocatedCents += unallocated;
        
        if (unallocated > 0) {
          availableCents += unallocated;
        } else if (unallocated < 0) {
          deallocateCents += unallocated;
        }
      }

      // The *true* total balance
      final totalBalance = totalAllocatedCents + totalUnallocatedCents;  

      if (mounted) {
        setState(() {
          _allTransactions = transactions;
          // _filteredTransactions = transactions; // Set by _applyFilter
          _totalBalanceCents = totalBalance;
          _availableToAllocateCents = availableCents;
          _availableToDeallocateCents = deallocateCents; 
          _isLoading = false;
          _applyFilter(_filter); // Apply the default filter (all)
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

  void _applyFilter([TransactionFilter? newFilter]) {
    // If a new filter is provided, update the state
    if (newFilter != null) {
      // If tapping the same filter, reset to 'all'
      setState(() {
        _filter = (newFilter == _filter) ? TransactionFilter.all : newFilter;
      });
    }

    // Apply the filter
    if (_filter == TransactionFilter.all) {
      _filteredTransactions = _allTransactions;
    } else if (_filter == TransactionFilter.toAllocate) {
      _filteredTransactions = _allTransactions
          .where((tx) => tx.unallocatedCents > 0)
          .toList();
    } else { // toDeallocate
      _filteredTransactions = _allTransactions
          .where((tx) => tx.unallocatedCents < 0)
          .toList();
    }
    setState(() {}); // Trigger a rebuild
  }

  String _formatCurrency(int amountInCents) {
    // Convert cents (int) to dollars (double)
    final double amountInDollars = amountInCents / 100.0;

    // Create a formatter that handles commas and $
    final formatter = NumberFormat.currency(
      locale: 'en_US', // This gives you 1,000.00
      symbol: '\$',
      decimalDigits: 2,
    );
    return formatter.format(amountInDollars);
  }

  // This function handles navigation to the new page
  void _onTransactionTapped(Transaction transaction) async {
    final bool? needsRefresh = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => AllocateTransactionScreen(transaction: transaction),
      ),
    );

    // If the allocation page returns 'true', reload all data
    if (needsRefresh == true && mounted) {
      _loadData();
    }
  }

  Future<void> _handleReset() async {
    // Show a confirmation dialog first
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reset Allocations?'),
        content: Text('This will delete all balancing transactions. '
            'Are you sure? (Make sure all accounts are toggled OFF first).'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Reset', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    // If confirmed, show a loading indicator
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Resetting...'), duration: Duration(seconds: 1)),
    );

    try {
      final message = await _apiService.resetBalancingTransactions();
      
      // On success, show the message and reload all your data
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.green),
        );
        _loadData(); // This is key, it refreshes the page
      }
    } catch (e) {
      // On error, show the error
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: Column(
        children: [
          _buildTotalsHeader(),
          Expanded(child: _buildTransactionList()),
        ],
      ),
    );
  }

  Widget _buildTotalsHeader() {
    // ... (This widget is identical to the one in my previous response)
    // It shows "Total Money" and "Available to Allocate"
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Column(
        children: [
           Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Total Money", style: Theme.of(context).textTheme.titleMedium),
              _isLoading
                  ? _buildLoadingSpinner()
                  : Text(
                      _formatCurrency(_totalBalanceCents),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).primaryColor,
                          ),
                    ),
            ],
          ),
          SizedBox(height: 8),
          InkWell(
            onTap: () => _applyFilter(TransactionFilter.toAllocate),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: _filter == TransactionFilter.toAllocate ? Colors.blue.withOpacity(0.1) : Colors.transparent,
              child: Row( // Available to ALLOCATE (Positive)
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Available to Allocate", style: Theme.of(context).textTheme.titleMedium),
                  _isLoading
                      ? _buildLoadingSpinner()
                      : Text(
                          _formatCurrency(_availableToAllocateCents),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.green[700], // Always green
                              ),
                        ),
                ],
              ),
            ),
          ),
          SizedBox(height: 8),
          InkWell(
            onTap: () => _applyFilter(TransactionFilter.toDeallocate),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: _filter == TransactionFilter.toDeallocate ? Colors.red.withOpacity(0.1) : Colors.transparent,
              child: Row( // Available to DEALLOCATE (Negative)
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("To Deallocate", style: Theme.of(context).textTheme.titleMedium),
                  _isLoading
                      ? _buildLoadingSpinner()
                      : Text(
                          _formatCurrency(_availableToDeallocateCents),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: _availableToDeallocateCents < 0 ? Colors.red : Colors.grey,
                              ),
                        ),
                ],
              ),
            ),
          ),
          TextButton(
            onPressed: _handleReset,
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(
              'TEMPORARY: Reset Balancing Transactions',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTransactionList() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    if (_errorMessage != null) {
      return Center(child: Text(_errorMessage!, style: TextStyle(color: Colors.red)));
    }
    if (_filteredTransactions.isEmpty) {
      if (_filter != TransactionFilter.all) {
        return Center(child: Text("No transactions in this filter."));
      }
      return Center(child: Text("You have no transactions yet."));
    }

    return ListView.builder(
      itemCount: _filteredTransactions.length,
      itemBuilder: (context, index) {
        final tx = _filteredTransactions[index]; // Use filtered list
        final color = tx.amountCents > 0 ? Colors.green[700] : 
                      tx.amountCents < 0 ? Colors.black : Colors.grey;
        
        // --- 10. USE NEW HELPER ---
        final bool isFullyAllocated = tx.isFullyAllocated;

        return ListTile(
          title: Text(
            tx.displayName,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isFullyAllocated ? Colors.grey : Colors.black,
            ),
          ),
            subtitle: _buildSubtitle(tx), 
            trailing: Text(
              tx.formattedAmount,
              style: TextStyle(
                color: isFullyAllocated ? Colors.grey : color,
                fontWeight: FontWeight.bold,
                fontSize: 16,
            ),
          ),
          onTap: isFullyAllocated 
              ? null // Don't allow tapping fully allocated transactions
              : () => _onTransactionTapped(tx),
        );
      },
    );
  }

  // This builds the subtitle and shows the unallocated amount
  Widget _buildSubtitle(Transaction tx) {
    String date = tx.formattedDate;
    
    // If it's fully allocated, just show the date
    if (tx.isFullyAllocated) {
      return Text(date, style: TextStyle(color: Colors.grey));
    }
    
    String unallocatedText = "";
    Color unallocatedColor = Colors.grey;

    // Check if it's partially allocated
    if (tx.unallocatedCents != tx.amountCents) {
      unallocatedText = "Unallocated: ${_formatCurrency(tx.unallocatedCents)}";
      unallocatedColor = tx.unallocatedCents > 0 ? Colors.green[700]! : Colors.red[700]!;
    }
    
    // For a brand new tx, this just shows the date.
    // For a partial one, it shows both.
    return RichText(
      text: TextSpan(
        style: TextStyle(color: Colors.grey[600], fontSize: 14), // Default subtitle style
        children: [
          TextSpan(
            text: date + '${unallocatedText != "" ? "  •   " : ""}',
          ),
          TextSpan(
            text: unallocatedText,
            style: TextStyle(color: unallocatedColor, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingSpinner() {
    return SizedBox(
      height: 16,
      width: 16,
      child: CircularProgressIndicator(strokeWidth: 2),
    );
  }
}