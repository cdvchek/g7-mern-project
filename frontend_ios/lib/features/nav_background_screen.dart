import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/features/auth/login_screen.dart';
import 'package:frontend_ios/features/dashboard_screen.dart';
import 'package:frontend_ios/features/envelope_screens/main_envelope_screen.dart';
import 'package:frontend_ios/features/accounts_screens/bank_list_screen.dart';
import 'package:frontend_ios/features/transactions_screens/transaction_screen.dart';
import 'package:frontend_ios/features/settings_screen/settings_screen.dart';
import 'package:frontend_ios/core/models/user.dart';

class NavBkgrdScreen extends StatefulWidget {
  const NavBkgrdScreen({super.key});

  @override
  State<NavBkgrdScreen> createState() => _NavBkgrdScreenState();
}

class _NavBkgrdScreenState extends State<NavBkgrdScreen> {
  // Currently selected tab index
  int selectedIndex = 0; 
  final apiService = ApiService();
  String userInitials = "";

  // List of screens that nav bar will show
  static const List<Widget> _pages = <Widget>[
    DashboardScreen(), // index 0
    MainEnvelopeScreen(), // index 1
    BanksListScreen(), // index 2
    TransactionsScreen(), // index 3
  ];

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }
  
  Future<void> _loadUserData() async {
    final user = await apiService.getUser();
    if (user != null && mounted) {
      setState(() {
        userInitials = getInitials(user.name);
      });
    }
  }

  String getInitials(String? name) {
    if (name == null || name.trim().isEmpty) {
      return "?";
    }

    // Split the name by spaces and remove any empty parts
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty).toList();

    if (parts.isEmpty) {
      return "?";
    }

    if (parts.length == 1) {
      // Only one word (e.g., "John")
      if (parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase(); // "JO"
      } else {
        return parts[0].toUpperCase(); // "J"
      }
    } else {
      // Two or more words (e.g., "John Doe")
      return (parts[0][0] + parts[1][0]).toUpperCase(); // "JD"
    }
  }

  void _onTabTapped(int index) {
    setState(() {
      selectedIndex = index; // Update the state with the new index
    });
  }

  void _handleLogout() async {
    // Destroys session and clears saved cookie from SharedPreferences
    await apiService.logout();
        
    // This clears all screens and pushes LoginScreen
    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (Route<dynamic> route) => false, // This removes all routes
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('BΰDGIE'),
            const SizedBox(width: 8),
            Image.asset(
              'assets/images/budgielogo.png',
              height: 30,
            ),
          ]
        ),
        actions: [
          // Profile icon with dropdown menu
          PopupMenuButton<String>(
            icon: CircleAvatar(
              // You can add a background image or icon here
              child: Text(userInitials), // Placeholder for profile pic
              backgroundColor: Color(0xff2C2D43),
              foregroundColor: Colors.white,
            ),
            onSelected: (String result) {
              if (result == 'logout') {
                _handleLogout();
              }
              else if (result == 'settings') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SettingsScreen()),
                );
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'settings',
                child: Text('Settings'),
              ),
              const PopupMenuItem<String>(
                value: 'logout',
                child: Text('Logout'),
              ),
            ],
          ),
        ],
      ),
      // Body is screen from screens list, based on the selected index
      body: _pages[selectedIndex],

      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ), // Dashboard
          BottomNavigationBarItem(
            icon: Icon(Icons.inbox),
            label: 'Envelopes',
          ), // Envelopes Screen
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance),
            label: 'Accounts',
          ), // Accounts Screen
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Transactions',
          ), // Transactions Screen
        ],
        currentIndex: selectedIndex, // Highlight current tab
        onTap: _onTabTapped,     
        
        // Styling
        selectedItemColor: Colors.blue, // Color for the active tab
        unselectedItemColor: Colors.white, // Color for inactive tabs
        showUnselectedLabels: true,       // Always show labels
        type: BottomNavigationBarType.fixed, // Fixes the position
        backgroundColor: Color(0xff2C2D43),
      ),
    );
  }
}