/**
 * webapkify.config.js
 * ملف إعدادات تحويل تطبيق الويب إلى APK
 * انسخ هذا الملف إلى مجلد client/ وقم بتعديل القيم حسب رغبتك
 */

module.exports = {
  // ================ المعلومات الأساسية ================
  appName: 'Telegram Drive',                 // اسم التطبيق الذي سيظهر للمستخدم
  appId: 'com.yourdomain.telegramdrive',     // معرف فريد (يفضل استخدام نطاقك الخاص)
  version: '1.0.0',                          // إصدار التطبيق
  versionCode: 1,                            // رقم الإصدار الداخلي (يُستخدم للتحديثات)

  // ================ ملفات التطبيق ================
  buildDir: 'dist',                          // مجلد ملفات التطبيق بعد البناء (من Vite)
  // index: 'index.html',                    // ملف الدخول (افتراضي index.html)

  // ================ أيقونة التطبيق ================
  icon: {
    // يمكنك وضع مسار لملف أيقونة واحد، وسيقوم بتحجيمها تلقائياً
    // أو يمكنك تحديد أحجام مختلفة يدوياً:
    // 'mdpi': 'public/icons/icon-48x48.png',
    // 'hdpi': 'public/icons/icon-72x72.png',
    // 'xhdpi': 'public/icons/icon-96x96.png',
    // 'xxhdpi': 'public/icons/icon-144x144.png',
    // 'xxxhdpi': 'public/icons/icon-192x192.png',
    // أو استخدم مساراً واحداً:
    path: 'public/icon.png',                 // أيقونة 512x512 بكسل (يفضل)
    // background: '#ffffff',                // خلفية الأيقونة (لأيقونات Android adaptive)
    // foreground: 'public/icon-foreground.png', // أيقونة أمامية لـ Adaptive Icon
  },

  // ================ شاشة البداية (Splash Screen) ================
  splashScreen: {
    // image: 'public/splash.png',           // صورة شاشة البداية
    // backgroundColor: '#4A90D9',          // لون خلفية شاشة البداية
    // resizeMode: 'contain',               // contain أو cover أو stretch
    // duration: 2000,                      // مدة ظهور شاشة البداية (ميلي ثانية)
  },

  // ================ اتجاه الشاشة ================
  orientation: 'portrait',                   // portrait (رأسي) أو landscape (أفقي) أو default (تلقائي)

  // ================ ألوان التطبيق ================
  theme: {
    primaryColor: '#4A90D9',                 // اللون الأساسي (شريط الحالة، الأزرار)
    backgroundColor: '#FFFFFF',               // لون خلفية التطبيق
    statusBarColor: '#4A90D9',               // لون شريط الحالة (Android 5.0+)
    navigationBarColor: '#4A90D9',           // لون شريط التنقل السفلي (Android 8.0+)
  },

  // ================ أذونات Android (Permissions) ================
  permissions: [
    // 'android.permission.INTERNET',         // مطلوب دائماً للاتصال بالإنترنت
    // 'android.permission.ACCESS_NETWORK_STATE',
    // 'android.permission.WRITE_EXTERNAL_STORAGE',
    // 'android.permission.READ_EXTERNAL_STORAGE',
    // 'android.permission.CAMERA',
    // 'android.permission.RECORD_AUDIO',
    // 'android.permission.VIBRATE',
    // 'android.permission.WAKE_LOCK',
    // 'android.permission.FOREGROUND_SERVICE',
    // 'android.permission.POST_NOTIFICATIONS', // Android 13+
  ],

  // ================ إعدادات Android الإضافية ================
  android: {
    minSdkVersion: 21,                       // الحد الأدنى لإصدار Android (21 = Android 5.0)
    targetSdkVersion: 33,                    // إصدار Android المستهدف (33 = Android 13)
    // compileSdkVersion: 33,                // إصدار SDK المستخدم في التجميع
    // buildToolsVersion: '33.0.0',          // إصدار أدوات البناء
    // useAndroidX: true,                   // استخدام مكتبات AndroidX (موصى به)
    // enableProguard: false,               // تفعيل تصغير حجم التطبيق (ProGuard)
  },

  // ================ إعدادات WebView ================
  webView: {
    // allowFileAccess: true,                // السماح بالوصول إلى ملفات الجهاز
    // allowUniversalAccessFromFileURLs: true,
    // allowFileAccessFromFileURLs: true,
    // javaScriptEnabled: true,              // تفعيل JavaScript (مطلوب)
    // domStorageEnabled: true,              // تفعيل DOM Storage (localStorage)
    // databaseEnabled: true,                // تفعيل Web SQL Database
    // userAgent: 'Mozilla/5.0 ...',         // تغيير User-Agent
  },

  // ================ إعدادات إضافية ================
  // fullscreen: false,                      // وضع ملء الشاشة (إخفاء شريط الحالة)
  // showLoadingProgress: true,              // إظهار شريط تقدم التحميل
  // hideTitleBar: true,                    // إخفاء شريط عنوان التطبيق
  // enableBackButton: true,                // تفعيل زر الرجوع للخلف
  // enableForwardButton: false,            // تفعيل زر التقدم للأمام
  // reloadOnResume: false,                 // إعادة تحميل التطبيق عند العودة من الخلفية
  // hardwareAccelerated: true,             // تفعيل تسريع الأجهزة

  // ================ إعدادات التوقيع (Signing) ================
  // signing: {
  //   keyAlias: 'my-key-alias',
  //   keyPassword: 'password123',
  //   storeFile: 'keystore.jks',             // ملف keystore الخاص بك
  //   storePassword: 'password123',
  // },

  // ================ اسم ملف APK الناتج ================
  // outputFileName: 'TelegramDrive.apk',    // اسم ملف APK النهائي
  // outputDir: './build',                   // مجلد حفظ ملف APK

  // ================ متغيرات البيئة (Environment Variables) ================
  // env: {
  //   VITE_API_BASE_URL: 'https://teledrivebackend.pxxl.click/api',
  // },
};