import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';
import { getApiUrl } from '../api/client';
import { formatSize, getMimeCategory } from '../utils/formatters';
import type { FileItem } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  route: { params: { itemId: number } };
  navigation: any;
}

const PreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const audioPlayer = useAudioPlayer(downloadUrl ? { uri: downloadUrl } : null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const videoPlayer = useVideoPlayer(downloadUrl ? { uri: downloadUrl } : null);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      const apiUrl = await getApiUrl();
      // We don't have a single-item endpoint, so we need to get from parent
      // Construct the preview URL directly
      setDownloadUrl(`${apiUrl}/files/preview/${itemId}`);

      // Try to get item info from store's cached items; else just show the URL
      const { useStore } = await import('../store/useStore');
      const state = useStore.getState();
      const found = state.items.find((i: FileItem) => i.id === itemId);
      if (found) {
        setItem(found);
      } else {
        // Minimal stub
        setItem({
          id: itemId,
          name: 'File',
          size: 0,
          mime_type: 'application/octet-stream',
          is_folder: 0,
          parent_id: null,
          owner_phone: '',
          created_at: '',
          updated_at: '',
        });
      }
    } catch {
      // proceed
    }
    setLoading(false);
  };

  const handlePlayPause = async () => {
    if (audioStatus.playing) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const handleDownload = async () => {
    if (!item) return;
    setIsDownloading(true);
    try {
      const downloaded = await File.downloadFileAsync(downloadUrl, Paths.document);
      Toast.show({ type: 'success', text1: 'Downloaded', text2: `Saved to ${downloaded.uri}` });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Download failed' });
    }
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.onSurface }}>File not found</Text>
      </View>
    );
  }

  const category = getMimeCategory(item.mime_type);

  const renderImage = () => (
    <View style={styles.mediaContainer}>
      <Text style={[styles.mediaName, { color: colors.onSurface }]}>{item.name}</Text>
      <Text style={[styles.mediaMeta, { color: colors.onSurfaceVariant }]}>
        {formatSize(item.size)}
      </Text>
    </View>
  );

  const renderVideo = () => (
    <View style={styles.mediaContainer}>
      <VideoView
        player={videoPlayer}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
      <Text style={[styles.mediaName, { color: colors.onSurface, padding: 16 }]}>{item.name}</Text>
    </View>
  );

  const renderAudio = () => (
    <View style={styles.mediaContainer}>
      <View style={styles.audioArt}>
        <MaterialCommunityIcons name="music-circle" size={120} color={colors.primary} />
      </View>
      <TouchableOpacity onPress={handlePlayPause}>
        <MaterialCommunityIcons
          name={audioStatus.playing ? 'pause-circle' : 'play-circle'}
          size={64}
          color={colors.primary}
        />
      </TouchableOpacity>
      <Text style={[styles.mediaName, { color: colors.onSurface }]}>{item.name}</Text>
    </View>
  );

  const renderPDF = () => (
    <View style={styles.mediaContainer}>
      <MaterialCommunityIcons name="file-pdf-box" size={80} color="#EF5350" />
      <Text style={[styles.mediaName, { color: colors.onSurface, marginTop: 16 }]}>{item.name}</Text>
      <Text style={[styles.mediaMeta, { color: colors.onSurfaceVariant }]}>
        {formatSize(item.size)}
      </Text>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleDownload}>
        <MaterialCommunityIcons name="download" size={22} color={colors.onPrimary} />
        <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Download to view</Text>
      </TouchableOpacity>
    </View>
  );

  const renderText = () => (
    <View style={styles.mediaContainer}>
      <MaterialCommunityIcons name="file-document-edit" size={80} color={colors.primary} />
      <Text style={[styles.mediaName, { color: colors.onSurface, marginTop: 16 }]}>{item.name}</Text>
      <Text style={[styles.mediaMeta, { color: colors.onSurfaceVariant }]}>
        {formatSize(item.size)}
      </Text>
    </View>
  );

  const renderUnknown = () => (
    <View style={styles.mediaContainer}>
      <MaterialCommunityIcons name="file-outline" size={80} color={colors.onSurfaceVariant} />
      <Text style={[styles.mediaName, { color: colors.onSurface, marginTop: 16 }]}>{item.name}</Text>
      <Text style={[styles.mediaMeta, { color: colors.onSurfaceVariant }]}>
        {formatSize(item.size)} · {item.mime_type}
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (category) {
      case 'image': return renderImage();
      case 'video': return renderVideo();
      case 'audio': return renderAudio();
      case 'pdf': return renderPDF();
      case 'text': return renderText();
      default: return renderUnknown();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      {renderContent()}

      {/* Download button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isDownloading ? (
          <View style={styles.downloadProgress}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.downloadText, { color: colors.primary }]}>
              Downloading... {downloadProgress}%
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.primary }]} onPress={handleDownload}>
            <MaterialCommunityIcons name="download" size={22} color={colors.onPrimary} />
            <Text style={[styles.downloadBtnText, { color: colors.onPrimary }]}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
  },
  audioArt: {
    marginBottom: 24,
  },
  mediaName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  mediaMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  downloadBtnText: {
    fontSize: 17,
    fontWeight: '600',
  },
  downloadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  downloadText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default PreviewScreen;
