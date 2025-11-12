import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/bank.dart';
import 'package:frontend_ios/features/accounts_screens/accounts_screen.dart';

class BanksListScreen extends StatefulWidget {
  const BanksListScreen({super.key});

  @override
  State<BanksListScreen> createState() => _BanksListScreenState();
}

class _BanksListScreenState extends State<BanksListScreen> {
  final ApiService _apiService = ApiService();
  late Future<List<BankConnection>> _banksFuture;

  @override
  void initState() {
    super.initState();
    _loadBanks();
  }

  void _loadBanks() {
    _banksFuture = _apiService.fetchBankConnections();
  }

  void _navigateToAccounts(BankConnection bank) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BankAccountsScreen(bank: bank),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Using "Accounts" as the title based on the bottom nav
    // but the content matches your "Linked Banks" wireframe.
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            "Linked Banks",
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          SizedBox(height: 20),
          ElevatedButton.icon(
            icon: Icon(Icons.add),
            label: Text("Link a New Bank"),
            onPressed: () {
              // TODO: Trigger Plaid Link flow
            },
            style: ElevatedButton.styleFrom(
              // Adding style to match wireframe
              foregroundColor: Colors.white,
              backgroundColor: Colors.black87,
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          SizedBox(height: 24),
          Expanded(
            child: FutureBuilder<List<BankConnection>>(
              future: _banksFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Text("Error: ${snapshot.error}"),
                  );
                }
                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Center(
                    child: Text("You haven't linked any banks yet."),
                  );
                }

                final banks = snapshot.data!;
                return ListView.builder(
                  itemCount: banks.length,
                  itemBuilder: (context, index) {
                    final bank = banks[index];
                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ListTile(
                        title: Text(
                          bank.institutionName,
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        trailing: Icon(Icons.chevron_right),
                        onTap: () => _navigateToAccounts(bank),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}