import { ActionSheetIOS, Alert, Platform } from 'react-native'

/**
 * Shows a native OS picker:
 *   - iOS  → ActionSheetIOS bottom sheet (native)
 *   - Android → Alert dialog with one button per option (native)
 *
 * @param title    Sheet/dialog title
 * @param options  The selectable options (do not include Cancel — it is added automatically)
 * @param onSelect Called with the chosen option string
 */
export function showNativePicker(
  title: string,
  options: string[],
  onSelect: (value: string) => void,
): void {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options, 'Cancel'],
        cancelButtonIndex: options.length,
      },
      index => {
        if (index < options.length) {
          onSelect(options[index])
        }
      },
    )
  } else {
    // Android: native Alert with one button per option + cancel
    Alert.alert(
      title,
      undefined,
      [
        ...options.map(opt => ({
          text: opt,
          onPress: () => onSelect(opt),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true },
    )
  }
}
