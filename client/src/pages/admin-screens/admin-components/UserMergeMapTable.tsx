import { UserMergeMap } from '@shared/user-merge-map';
import { useMemo } from 'react';
import { IconArowLeft } from '../../../components/Icons';

interface Props {
  map: UserMergeMap;
}

export function UserMergeMapTable({ map }: Props) {
  const entries = useMemo(() => Array.from(map.entries()), [map]);
  return (
    <table className='user-merge-map-table'>
      <thead>
        <tr>
          <th>Primary</th>
          <th></th>
          <th>Merged</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([primaryUid, mergedUids]) => (
          <tr key={primaryUid}>
            <td>{primaryUid}</td>
            <td style={{ transform: 'rotate(180deg)' }}>
              <IconArowLeft />
            </td>
            <td>{mergedUids.join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
