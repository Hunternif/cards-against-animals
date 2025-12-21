import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { globalSettingsConverter } from '../../../shared/src/firestore-converters';
import { firestore } from '../firebase';

export const gloablSettingsRef = doc(
  firestore,
  'settings',
  'global_settings',
).withConverter(globalSettingsConverter);

export function useGlobalSettings() {
  return useDocumentData(gloablSettingsRef);
}
