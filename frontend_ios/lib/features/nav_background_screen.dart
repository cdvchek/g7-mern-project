import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/features/auth/login_screen.dart';
import 'package:frontend_ios/features/dashboard_screen.dart';
import 'package:frontend_ios/features/envelope_screens/main_envelope_screen.dart';
import 'package:frontend_ios/features/accounts_screens/main_accounts_screen.dart';
import 'package:frontend_ios/features/settings_screen.dart';

class NavBkgrdScreen extends StatefulWidget {
  const NavBkgrdScreen({super.key});

  @override
  State<NavBkgrdScreen> createState() => _NavBkgrdScreenState();
}

class _NavBkgrdScreenState extends State<NavBkgrdScreen> {
  // Currently selected tab index
  int selectedIndex = 0; 

  final apiService = ApiService();

  // List of screens that nav bar will show
  static const List<Widget> _pages = <Widget>[
    DashboardScreen(), // index 0
    MainEnvelopeScreen(), // index 1
    MainAccountsScreen(), // index 2
    SettingsScreen(), // index 3
  ];

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
        title: const Text('Our Budget App'),
        actions: [
          // Profile icon with dropdown menu
          PopupMenuButton<String>(
            icon: CircleAvatar(
              // You can add a background image or icon here
              child: Text("JZ"), // Placeholder for profile pic
              backgroundColor: Color(0xff2C2D43),
              foregroundColor: Colors.white,
            ),
            onSelected: (String result) {
              if (result == 'logout') {
                _handleLogout();
              }
              else if (result == 'settings') {
                setState(() {
                  selectedIndex = 3; // Navigate to Settings tab
                });
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'logout',
                child: Text('Logout'),
              ),
              const PopupMenuItem<String>(
                value: 'settings',
                child: Text('Settings'),
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
            label: 'Settings',
          ), // Settings Screen
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