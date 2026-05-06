import { ReactElement } from 'react';
import Chazzy from './Chazzy';

export const dynamic = 'force-dynamic';

export default function ChazzyPage({ params: { channelId } }: { params: { channelId: string } }): ReactElement {
  // 주소창에 입력된 모든 ID를 '-' 기준으로 쪼개서 배열(리스트)로 만듭니다.
  const chzzkIds = channelId.split('-');

  return (
    <Chazzy
      // 기존의 단일 ID 대신, 치지직 ID '리스트'를 통째로 넘겨줍니다. 
      // 안 쓰는 다른 플랫폼(트위치 등) 코드는 지웠습니다.
      chzzkChannelIds={chzzkIds}
    />
  );
}