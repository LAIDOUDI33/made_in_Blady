import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import RFQListScreen from '../screens/rfq/RFQListScreen';
import CreateRFQScreen from '../screens/rfq/CreateRFQScreen';
import MessageListScreen from '../screens/messages/MessageListScreen';
import BuyerDashboard from '../screens/dashboard/BuyerDashboard';
import SellerDashboard from '../screens/dashboard/SellerDashboard';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Components
import SearchBar from '../components/SearchBar';

// Constants
import { Colors, Spacing, Icons } from '../utils/constants';

// Types
export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;
  
  // Main Tabs
  Main: undefined;
  
  // Products
  ProductList: { category?: string; searchQuery?: string };
  ProductDetail: { productId: string };
  
  // RFQs
  RFQList: undefined;
  CreateRFQ: undefined;
  RFQDetail: { rfqId: string };
  
  // Messages
  Messages: undefined;
  Chat: { conversationId: string; userName: string };
  
  // Dashboard
  BuyerDashboard: undefined;
  SellerDashboard: undefined;
  
  // Profile
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ============================================
// Custom Theme
// ============================================

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
  },
};

// ============================================
// Bottom Tab Navigator (Main App)
// ============================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'PostRFQ':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'MessagesTab':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          // Special styling for center button
          if (route.name === 'PostRFQ') {
            return (
              <View style={styles.centerButton}>
                <Ionicons name={iconName} size={32} color={Colors.white} />
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={ProductListScreen}
        options={{ tabBarLabel: 'Rechercher' }}
      />
      <Tab.Screen 
        name="PostRFQ" 
        component={CreateRFQScreen}
        options={{ 
          tabBarLabel: 'Poster AO',
          tabBarStyle: { display: 'none' }, // Hide tab bar on this screen
        }}
      />
      <Tab.Screen 
        name="MessagesTab" 
        component={MessageListScreen}
        options={{ 
          tabBarLabel: 'Messages',
          tabBarBadge: 3, // This would come from state
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// Auth Stack Navigator
// ============================================

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// Main Stack Navigator
// ============================================

interface RootNavigatorProps {
  isAuthenticated: boolean;
  initialRouteName?: 'Auth' | 'Main';
}

export default function RootNavigator({ 
  isAuthenticated, 
  initialRouteName = isAuthenticated ? 'Main' : 'Auth' 
}: RootNavigatorProps) {
  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerBackTitleVisible: false,
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: '600' as const,
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />

        {/* Main App with Tabs */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Product Screens */}
        <Stack.Screen
          name="ProductList"
          component={ProductListScreen}
          options={({ route }) => ({
            title: route.params?.searchQuery || 'Produits',
            headerSearchBarOptions: {
              placeholder: 'Rechercher des produits...',
              hideWhenScrolling: false,
            },
          })}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Détails du produit' }}
        />

        {/* RFQ Screens */}
        <Stack.Screen
          name="RFQList"
          component={RFQListScreen}
          options={{ title: "Mes appels d'offres" }}
        />
        <Stack.Screen
          name="CreateRFQ"
          component={CreateRFQScreen}
          options={{ title: "Nouvel appel d'offres", presentation: 'modal' }}
        />

        {/* Message Screens */}
        <Stack.Screen
          name="Messages"
          component={MessageListScreen}
          options={{ title: 'Messages' }}
        />

        {/* Dashboard Screens */}
        <Stack.Screen
          name="BuyerDashboard"
          component={BuyerDashboard}
          options={{ title: 'Tableau de bord' }}
        />
        <Stack.Screen
          name="SellerDashboard"
          component={SellerDashboard}
          options={{ title: 'Espace vendeur' }}
        />

        {/* Profile Screens */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Mon profil' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
    ...Shadows.lg,
  },
});

// Export for use in other files
export { MainTabs, AuthStack };
