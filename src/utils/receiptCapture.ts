import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

const capture = (ref: RefObject<View | null>) =>
  captureRef(ref as RefObject<View>, { format: 'png', quality: 1 });

export const shareReceipt = async (ref: RefObject<View | null>) => {
  const uri = await capture(ref);
  await Sharing.shareAsync(uri, { mimeType: 'image/png' });
};

export const saveReceiptToAlbum = async (ref: RefObject<View | null>) => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('权限不足', '需要相册权限才能保存图片');
    return;
  }
  const uri = await capture(ref);
  await MediaLibrary.saveToLibraryAsync(uri);
  Alert.alert('已保存', '收据已保存到相册');
};
