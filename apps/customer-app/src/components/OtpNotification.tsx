import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { theme } from '../theme';

interface OtpNotificationProps {
  visible: boolean;
  phone: string;
  code: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OtpNotification: React.FC<OtpNotificationProps> = ({
  visible,
  phone,
  code,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 20, // Distance from top
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity 
        style={styles.content} 
        activeOpacity={0.95}
        onPress={handleClose}
      >
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🛒</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.appName}>F&G Messaging</Text>
            <Text style={styles.time}>now</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.msgText}>
            <Text style={styles.boldText}>OTP: {code}</Text> is your secret code for F&G login. Valid for 5 mins. Do not share.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyBtn}>COPY CODE</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 9999,
    ...theme.shadows.card,
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 14,
  },
  meta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  body: {
    marginBottom: 8,
    paddingLeft: 2,
  },
  msgText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  boldText: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  copyBtn: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
});
