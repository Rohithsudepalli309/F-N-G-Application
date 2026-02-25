import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { socketService } from './src/services/socket';
import { OtpNotification } from './src/components/OtpNotification';
import { useAuthStore } from './src/store/useAuthStore';

const App = () => {
  const [notification, setNotification] = React.useState({ visible: false, phone: '', code: '' });
  const setLastOtp = useAuthStore((state) => state.setLastOtp);

  React.useEffect(() => {
    // Connect socket globally on app start
    console.log('[DEBUG] Initializing Global Socket Connection...');
    socketService.connect();

    // Global listener for Dev OTPs
    socketService.on('dev:otp', (data: any) => {
      console.log('[DEBUG] Global OTP Received:', data.otp, 'for', data.phone);
      setNotification({ visible: true, phone: data.phone, code: data.otp });
      setLastOtp(data.otp); // Save to store for OtpScreen to pick up
    });

    return () => {
      socketService.off('dev:otp');
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
      <OtpNotification 
        visible={notification.visible}
        code={notification.code}
        phone={notification.phone}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
};

export default App;
