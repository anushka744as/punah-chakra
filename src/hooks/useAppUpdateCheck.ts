import { useEffect } from 'react';
import { Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';

// Prompts the user to update as soon as Google Play has a newer version
// than the one currently installed. Android only — Play's In-App Update
// API has no iOS equivalent, and this app isn't on the App Store.
export function useAppUpdateCheck() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const inAppUpdates = new SpInAppUpdates(false);
    inAppUpdates
      .checkNeedsUpdate()
      .then((result) => {
        if (result.shouldUpdate) {
          inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
        }
      })
      .catch(() => {});
  }, []);
}
