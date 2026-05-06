'use client';

import { CSSProperties, ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Chat, ClearMessage } from '../chat/types';
import useMergedList from '../chat/useMergedList';
import useChzzkChatList from '../chzzk/useChatList';
import useChzzkChannel from '../chzzk/useChannel';
import useLiveStatus from '../chzzk/useLiveStatus';
import ChatRow from './ChatRow';
import ChazzyMenu from './ChazzyMenu';
import CheeseChatRow from './CheeseChatRow';
import EmptyCheeseChatRow from './EmptyCheeseChatRow';
import Status from './Status';
import './styles.css';

export interface ChazzyProps {
  // 이제 단일 ID가 아니라 치지직 ID 배열을 받습니다.
  chzzkChannelIds: string[];
}

export default function Chazzy(props: ChazzyProps): ReactElement {
  // 전달받은 3명의 치지직 ID를 분리합니다.
  const [id1, id2, id3] = props.chzzkChannelIds;

  const isChatAutoScrollEnabledRef = useRef<boolean>(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const endOfChatScrollRef = useRef<HTMLDivElement>(null);
  const cheeseChatScrollRef = useRef<HTMLDivElement>(null);
  const [cheeseChatStyle, setCheeseChatStyle] = useState<CSSProperties>(undefined);

  // --- [스트리머 1] 연결 ---
  const { channel: channel1 } = useChzzkChannel(id1);
  const { liveStatus: live1 } = useLiveStatus(id1);

  // --- [스트리머 2] 연결 ---
  const { channel: channel2 } = useChzzkChannel(id2);
  const { liveStatus: live2 } = useLiveStatus(id2);

  // --- [스트리머 3] 연결 ---
  const { channel: channel3 } = useChzzkChannel(id3);
  const { liveStatus: live3 } = useLiveStatus(id3);

  // 클린봇 메세지 삭제 처리 로직 (3명 통합)
  const handleClearChzzkMessage = useCallback((clearMessage: ClearMessage) => {
    setChatList((prevChatList) => {
      const findFn = ({ userId }: Chat) =>
        clearMessage.type === 'message'
          ? clearMessage.method.type === 'chzzk' && clearMessage.method.userId === userId
          : false;
      
      const lastIndexOnChatList = prevChatList.findLastIndex(findFn);
      if (lastIndexOnChatList !== -1) {
        const newChatList = [...prevChatList];
        newChatList.splice(lastIndexOnChatList, 1, {
          ...prevChatList[lastIndexOnChatList],
          deletionReason: '클린봇이 부적절한 표현을 감지했습니다.',
        });
        return newChatList;
      }
      return prevChatList;
    });
  }, []);

  // --- 채팅 목록 불러오기 (3명 각각) ---
  const { pendingChatListRef: pendingChat1, pendingCheeseChatListRef: pendingCheese1 } = useChzzkChatList(live1?.chatChannelId, handleClearChzzkMessage);
  const { pendingChatListRef: pendingChat2, pendingCheeseChatListRef: pendingCheese2 } = useChzzkChatList(live2?.chatChannelId, handleClearChzzkMessage);
  const { pendingChatListRef: pendingChat3, pendingCheeseChatListRef: pendingCheese3 } = useChzzkChatList(live3?.chatChannelId, handleClearChzzkMessage);

  // 3명의 채팅을 하나로 모으기 위한 리스트
  const pendingChatListRefs = useMemo(
    () => [pendingChat1, pendingChat2, pendingChat3],
    [pendingChat1, pendingChat2, pendingChat3],
  );

  const pendingCheeseChatListRefs = useMemo(
    () => [pendingCheese1, pendingCheese2, pendingCheese3],
    [pendingCheese1, pendingCheese2, pendingCheese3],
  );

  // 최종 통합된 일반 채팅 리스트
  const { list: chatList, setList: setChatList } = useMergedList({
    pendingListRefs: pendingChatListRefs,
    maxLength: 1000,
  });

  // 최종 통합된 후원(치즈) 채팅 리스트
  const { list: cheeseChatList } = useMergedList({
    pendingListRefs: pendingCheeseChatListRefs,
    maxLength: 10,
  });

  // 스크롤 관련 로직
  useEffect(() => {
    if (isChatAutoScrollEnabledRef.current && endOfChatScrollRef.current != null) {
      endOfChatScrollRef.current.scrollIntoView();
    }
  }, [chatList, cheeseChatList]);

  const handleChatScroll = useCallback(() => {
    if (chatScrollRef.current == null) return;
    isChatAutoScrollEnabledRef.current =
      chatScrollRef.current.scrollHeight <= chatScrollRef.current.scrollTop + chatScrollRef.current.clientHeight + 120;
  }, []);

  const handleCheeseChatScroll = useCallback(() => {
    if (cheeseChatScrollRef.current == null) return;
    const isTop = cheeseChatScrollRef.current.scrollTop <= 0;
    const isBottom =
      cheeseChatScrollRef.current.scrollTop >=
      cheeseChatScrollRef.current.scrollHeight - cheeseChatScrollRef.current.clientHeight;
    setCheeseChatStyle({
      maskImage: `linear-gradient(to bottom, ${isTop ? 'red' : 'transparent'} 0, red 1em calc(100% - 1em), ${isBottom ? 'red' : 'transparent'} 100%)`,
    });
  }, []);

  useLayoutEffect(() => {
    handleCheeseChatScroll();
  }, [cheeseChatList]);

  const arrangedCheeseChatList = useMemo(() => {
    const copied = cheeseChatList.filter((cheeseChat) => new Date().getTime() - cheeseChat.time < 60 * 5 * 1000);
    copied.reverse();
    return copied;
  }, [cheeseChatList]);

  return (
    <div id="chazzy-container">
      <div id="chat-container">
        <div
          id="chat-list-container"
          ref={(ref) => {
            if (ref == null) return;
            if (chatScrollRef.current != null) {
              chatScrollRef.current.removeEventListener('wheel', handleChatScroll);
              chatScrollRef.current.removeEventListener('touchmove', handleChatScroll);
            }
            ref.addEventListener('wheel', handleChatScroll);
            ref.addEventListener('touchmove', handleChatScroll);
            chatScrollRef.current = ref;
          }}
          style={{ flex: 2, height: '100%', overflowY: 'scroll' }}
        >
          {chatList.map((chat) => chat && <ChatRow key={chat.uid} {...chat} />)}
          <div ref={endOfChatScrollRef} />
        </div>
        
        {/* 후원(치즈) 채팅창 영역 */}
        <div
          id="cheese-chat-list-container"
          ref={(ref) => {
            if (ref == null) return;
            if (cheeseChatScrollRef.current != null) {
              cheeseChatScrollRef.current.removeEventListener('scroll', handleCheeseChatScroll);
            }
            ref.addEventListener('scroll', handleCheeseChatScroll);
            cheeseChatScrollRef.current = ref;
          }}
          style={cheeseChatStyle}
        >
          {arrangedCheeseChatList.length === 0 ? (
            <EmptyCheeseChatRow />
          ) : (
            arrangedCheeseChatList.map((cheeseChat) => <CheeseChatRow key={cheeseChat.uid} {...cheeseChat} />)
          )}
        </div>
      </div>
      
      {/* 우측 상단 방송 상태 아이콘 표시 영역 */}
      <div id="status-container">
        {id1 != null && channel1 != null && (
          <>
            <Status
              provider="chzzk"
              channelName={channel1.channelName}
              channelImageUrl={channel1.channelImageUrl ?? 'https://ssl.pstatic.net/cmstatic/nng/img/img_anonymous_square_gray_opacity2x.png?type=f120_120_na'}
              concurrentUserCount={live1?.concurrentUserCount}
              liveCategoryValue={live1?.liveCategoryValue}
              isLive={live1?.status === 'OPEN'}
            />
            <div className="divider" />
          </>
        )}
        {id2 != null && channel2 != null && (
          <>
            <Status
              provider="chzzk"
              channelName={channel2.channelName}
              channelImageUrl={channel2.channelImageUrl ?? 'https://ssl.pstatic.net/cmstatic/nng/img/img_anonymous_square_gray_opacity2x.png?type=f120_120_na'}
              concurrentUserCount={live2?.concurrentUserCount}
              liveCategoryValue={live2?.liveCategoryValue}
              isLive={live2?.status === 'OPEN'}
            />
            <div className="divider" />
          </>
        )}
        {id3 != null && channel3 != null && (
          <>
            <Status
              provider="chzzk"
              channelName={channel3.channelName}
              channelImageUrl={channel3.channelImageUrl ?? 'https://ssl.pstatic.net/cmstatic/nng/img/img_anonymous_square_gray_opacity2x.png?type=f120_120_na'}
              concurrentUserCount={live3?.concurrentUserCount}
              liveCategoryValue={live3?.liveCategoryValue}
              isLive={live3?.status === 'OPEN'}
            />
            <div className="divider" />
          </>
        )}
        <ChazzyMenu />
      </div>
    </div>
  );
}