import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../utils/constants';

interface Conversation {
  id: string;
  name: string;
  avatar?: string | null;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isVerified: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'SolarTech Algérie',
    avatar: null,
    lastMessage: 'Bonjour, nous pouvons vous proposer un tarif spécial pour cette quantité...',
    time: '10:30',
    unread: 2,
    isOnline: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'SCIMAT Skikda',
    avatar: null,
    lastMessage: 'Votre commande a été expédiée. Numéro de suivi : ALG123456',
    time: 'Hier',
    unread: 0,
    isOnline: false,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Les Oliviers de Béjaïa',
    avatar: null,
    lastMessage: 'Merci pour votre confiance ! Nous confirmons la livraison pour demain.',
    time: 'Hier',
    unread: 0,
    isOnline: true,
    isVerified: true,
  },
  {
    id: '4',
    name: 'MétalPro Oran',
    avatar: null,
    lastMessage: 'Avez-vous reçu notre devis ? N\'hésitez pas si vous avez des questions.',
    time: 'Lun',
    unread: 1,
    isOnline: false,
    isVerified: false,
  },
];

export default function MessageListScreen() {
  const navigation = useNavigation();

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat' as never, { 
        conversationId: item.id, 
        userName: item.name 
      } as never)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, item.isOnline && styles.avatarOnline]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          )}
        </View>
        
        {/* Online indicator */}
        {item.isOnline && <View style={styles.onlineIndicator} />}
        
        {/* Verified badge */}
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={10} color={Colors.white} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.message} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={MOCK_CONVERSATIONS}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptySubtitle}>
              Vos conversations apparaîtront ici
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOnline: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    fontFamily: FontFamily.semiBold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginRight: Spacing.sm,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: FontFamily.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    fontFamily: FontFamily.semiBold,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
});
