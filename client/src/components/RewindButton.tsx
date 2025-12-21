import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserMergeMap } from '../../../shared/src/user-merge-map';
import { useGlobalSettings } from '../api/global-settings';
import { useUsersMergeMap } from '../api/stats-hooks';
import { loadCanonicalUserStats } from '../api/stats-repository';
import { useHandler2 } from '../hooks/data-hooks';
import { GameButton } from './Buttons';
import { Twemoji } from './Twemoji';

interface Props {
  user: User;
}

export function RewindButton({ user }: Props) {
  const navigate = useNavigate();
  const [globalSettings] = useGlobalSettings();
  const [userStatsExist, setUsersStatsExit] = useState(false);
  // Subscribe to changes in users merge map
  const [mergeMap] = useUsersMergeMap();

  const [fetchStats] = useHandler2(
    async (uid: string, mergeMap: UserMergeMap) => {
      const stats = await loadCanonicalUserStats(uid, 'all_time', mergeMap);
      if (stats) {
        setUsersStatsExit(true);
      } else {
        setUsersStatsExit(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (globalSettings?.enable_rewind && mergeMap) {
      fetchStats(user.uid, mergeMap);
    }
  }, [user.uid, globalSettings?.enable_rewind, mergeMap]);

  if (userStatsExist) {
    return (
      <GameButton
        className="rewind-button"
        onClick={() => navigate('/rewind')}
        iconLeft={<Twemoji>✨</Twemoji>}
      >
        See your Rewind
      </GameButton>
    );
  } else {
    return null;
  }
}
