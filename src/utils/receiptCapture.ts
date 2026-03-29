import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

const capture = async (ref: RefObject<View | null>) => {
  if (!ref.current) {
    throw new Error('收据视图未就绪');
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  return captureRef(ref.current, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
};

export const shareReceipt = async (ref: RefObject<View | null>) => {
  try {
    const uri = await capture(ref);
    await Sharing.shareAsync(uri, { mimeType: 'image/png' });
  } catch (error) {
    Alert.alert('失败', error instanceof Error ? error.message : '分享失败，请重试');
  }
};

export const saveReceiptToAlbum = async (ref: RefObject<View | null>) => {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    if (!permission.granted) {
      Alert.alert('权限不足', '需要相册权限才能保存图片');
      return;
    }
    const uri = await capture(ref);
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('已保存', '收据已保存到相册');
  } catch (error) {
    Alert.alert('保存失败', error instanceof Error ? error.message : '图片保存失败，请重试');
  }
};
