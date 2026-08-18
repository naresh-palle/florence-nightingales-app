import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const injectedCSS = `
    var style = document.createElement('style');
    style.innerHTML = ' .et_mobile_menu { background-color: #ffffff !important; opacity: 1 !important; z-index: 99999 !important; } .et-fixed-header { background-color: #ffffff !important; } ';
    document.head.appendChild(style);
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        source={{ uri: 'https://www.florencenightingales.in/' }} 
        style={styles.webview}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedCSS}
      />
      <StatusBar style="dark" backgroundColor="#ffffff" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  webview: {
    flex: 1,
  }
});
