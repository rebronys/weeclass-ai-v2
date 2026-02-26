import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

// ── 상수 ──────────────────────────────────────────────
const SERVICE_NAME = '은평초등학교 위클래스 온라인 상담소';
const COUNSELOR_NAME = '공부하는 윤정쌤';
const VERSION = 'v3.1 · 2026.02.26';

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];
const GENDERS = ['남자', '여자', '비공개'];

const CATEGORIES = [
  '친구와의 다툼', '따돌림·괴롭힘', '새 친구 사귀기 어려움',
  '공부·숙제 스트레스', '시험 불안', '집중이 잘 안 돼요',
  '스마트폰·게임 고민', '화·감정조절 어려움', '슬픔·우울한 기분',
  '막연한 걱정·불안', '학교 가기 싫음', '선생님과의 관계',
  '발표·수업 참여 두려움', '가족 갈등', '형제·자매 갈등',
  '전학·새 학기 적응', '몸이 자주 아파요', '자존감·외모 자신감',
  '사이버폭력·온라인 문제', '말하기 어려운 일',
];

const AVATARS = {
  남자: [
    { name: '손흥민', emoji: '⚽', type: '운동선수' },
    { name: '이강인', emoji: '🏅', type: '운동선수' },
    { name: '정국', emoji: '🎤', type: '아이돌' },
    { name: '유재석', emoji: '🎭', type: '방송인' },
    { name: '차은우', emoji: '✨', type: '배우' },
    { name: '공유', emoji: '🎬', type: '배우' },
  ],
  여자: [
    { name: '아이유', emoji: '🌸', type: '가수' },
    { name: '태연', emoji: '🎵', type: '가수' },
    { name: '수지', emoji: '💫', type: '배우' },
    { name: '김연아', emoji: '⛸️', type: '운동선수' },
    { name: '안산', emoji: '🏹', type: '운동선수' },
    { name: '김연경', emoji: '🏐', type: '운동선수' },
  ],
  캐릭터: [
    { name: '뽀로로', emoji: '🐧', type: '애니메이션' },
    { name: '피카츄', emoji: '⚡', type: '포켓몬' },
    { name: '도라에몽', emoji: '🔵', type: '만화' },
    { name: '스폰지밥', emoji: '🧽', type: '애니메이션' },
    { name: '엘사', emoji: '❄️', type: '디즈니' },
    { name: '마리오', emoji: '🍄', type: '게임' },
  ],
};

const RISK_KEYWORDS = [
  '죽고싶', '자살', '자해', '죽어버릴', '사라지고싶',
  '목숨끊', '칼로', '약먹고', '뛰어내려', '때려',
];

function detectRisk(text) {
  const t = text.replace(/\s/g, '');
  return RISK_KEYWORDS.some(k => t.includes(k));
}

function getTime() {
  const n = new Date();
  return `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`;
}

// ── AI 호출 ────────────────────────────────────────────
async function callAI(messages, userInfo) {
  const [reply] = await Promise.all([
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        grade: userInfo.grade,
        category: userInfo.category,
        character: userInfo.avatar,
        gender: userInfo.gender,
      }),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => d.reply || '잠깐, 생각 정리 중이야 💭 다시 한번 말해줄래?')
      .catch(() => '연결이 잠깐 끊겼어. 다시 보내줄래? 💙'),
    new Promise(r => setTimeout(r, 2000)),
  ]);
  return reply;
}

// ══════════════════════════════════════════════════════
// CheckIn 모달
// ══════════════════════════════════════════════════════
function CheckInModal({ onDone }) {
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [avatarTab, setAvatarTab] = useState('남자');
  const [avatar, setAvatar] = useState(null);

  const ready = grade && gender && category && avatar;

  return (
    <div className="checkin-overlay">
      <div className="checkin-inner">
        <div className="checkin-logo">🌸</div>
        <div className="checkin-title">{SERVICE_NAME}</div>
        <div className="checkin-sub">
          {COUNSELOR_NAME}이 기다리고 있어요.<br />
          아래 항목을 선택하면 상담을 시작할 수 있어요.
        </div>

        <div className="privacy-note">
          🔒 이름·주소 등 개인정보는 묻지 않아요. 위험한 상황이면 '도와줘'라고 알려주세요. 필요 시 선생님·기관에 연결될 수 있어요.
        </div>

        {/* 학년 */}
        <div className="checkin-section">
          <div className="checkin-label">학년</div>
          <div className="chip-row">
            {GRADES.map(g => (
              <button key={g} className={`chip ${grade === g ? 'active' : ''}`}
                onClick={() => setGrade(g)}>{g}</button>
            ))}
          </div>
        </div>

        {/* 성별 */}
        <div className="checkin-section">
          <div className="checkin-label">성별</div>
          <div className="chip-row">
            {GENDERS.map(g => (
              <button key={g} className={`chip ${gender === g ? 'active' : ''}`}
                onClick={() => setGender(g)}>{g}</button>
            ))}
          </div>
        </div>

        {/* 고민유형 */}
        <div className="checkin-section">
          <div className="checkin-label">오늘의 고민 유형</div>
          <div className="category-grid">
            {CATEGORIES.map((c, i) => (
              <button key={c} className={`category-chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}>
                {i + 1}. {c}
              </button>
            ))}
          </div>
        </div>

        {/* 아바타 */}
        <div className="checkin-section">
          <div className="checkin-label">나를 대신할 아바타</div>
          <div className="avatar-tabs">
            {['남자', '여자', '캐릭터'].map(t => (
              <button key={t} className={`avatar-tab ${avatarTab === t ? 'active' : ''}`}
                onClick={() => setAvatarTab(t)}>{t}</button>
            ))}
          </div>
          <div className="avatar-grid">
            {AVATARS[avatarTab].map(a => (
              <button key={a.name}
                className={`avatar-btn ${avatar?.name === a.name ? 'active' : ''}`}
                onClick={() => setAvatar(a)}>
                <span className="avatar-emoji">{a.emoji}</span>
                <span className="avatar-name">{a.name}</span>
                <span className="avatar-type">{a.type}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" disabled={!ready}
          onClick={() => onDone({ grade, gender, category, avatar })}>
          {ready ? '💙 상담 시작하기' : '위 항목을 모두 선택해주세요'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 채팅 화면
// ══════════════════════════════════════════════════════
function ChatScreen({ userInfo, onEnd }) {
// const gradeNum = parseInt(userInfo.grade);
  const gradeStr = userInfo.grade;

  const welcomeMsg = `안녕! ${gradeStr} ${userInfo.avatar?.emoji} ${userInfo.avatar?.name}로 들어왔구나 😊\n여긴 네 마음을 편하게 말할 수 있는 곳이야. 이름 같은 개인정보는 말하지 않아도 돼. 혹시 지금 당장 위험한 상황이면 '도와줘'라고 알려줘.\n\n오늘은 '${userInfo.category}' 이야기로 시작해볼까? 아니면 다른 주제를 골라도 괜찮아 😊`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: welcomeMsg, time: getTime() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [risk, setRisk] = useState(false);
  const [keepAlive, setKeepAlive] = useState(null); // null | 'toast' | 'card'
  const [quickReplies, setQuickReplies] = useState([]);
  const bottomRef = useRef(null);
  const lastMsgTime = useRef(Date.now());
  const kaTimer60 = useRef(null);
  const kaTimer120 = useRef(null);

  // 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, keepAlive]);

  // Keep-alive 타이머
  const resetKATimer = useCallback(() => {
    clearTimeout(kaTimer60.current);
    clearTimeout(kaTimer120.current);
    setKeepAlive(null);
    lastMsgTime.current = Date.now();
    kaTimer60.current = setTimeout(() => setKeepAlive('toast'), 60000);
    kaTimer120.current = setTimeout(() => setKeepAlive('card'), 120000);
  }, []);

  useEffect(() => {
    resetKATimer();
    return () => {
      clearTimeout(kaTimer60.current);
      clearTimeout(kaTimer120.current);
    };
  }, [resetKATimer]);

  // 퀵리플라이 — 고민유형별 선택지
  useEffect(() => {
    const qr = {
      '친구와의 다툼': ['그 장면을 말해줄게', '마음 점수 알려줄게', '어떻게 해야 할지 모르겠어'],
      '따돌림·괴롭힘': ['지금은 안전해', '도움이 필요해', '아무도 모르게 해줘'],
      '시험 불안': ['불안 점수 알려줄게', '숨 쉬기 해볼게', '공부 방법이 문제야'],
      '화·감정조절 어려움': ['화가 많이 났어', '몸에서 느껴져', '멈추고 싶어'],
      '슬픔·우울한 기분': ['이유를 모르겠어', '오래됐어', '누군가랑 얘기하고 싶어'],
    };
    setQuickReplies(qr[userInfo.category] || ['더 이야기할게', '잘 모르겠어', '괜찮아졌어']);
  }, [userInfo.category]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    resetKATimer();

    if (detectRisk(msg)) setRisk(true);

    const userMsg = { role: 'user', content: msg, time: getTime() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    // 시스템 프롬프트는 api/chat.js에서 처리
    const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
    const reply = await callAI(apiMsgs, userInfo);

    setMessages(prev => [...prev, { role: 'assistant', content: reply, time: getTime() }]);
    setLoading(false);
    resetKATimer();
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="chat-wrap">
      <div className="chat-bg" />

      {/* 헤더 */}
      <div className="chat-header">
        <div className="chat-avatar-wrap">🌸</div>
        <div>
          <div className="chat-header-title">{SERVICE_NAME}</div>
          <div className="chat-header-name">{COUNSELOR_NAME}</div>
          <div className="chat-header-status">
            <span className="status-dot" /> 상담 중
          </div>
        </div>
        <button className="btn-end-session" onClick={onEnd}>상담 종료</button>
      </div>

      {/* 위험 알림 */}
      {risk ? (
        <div className="alert-banner alert-danger">
          🚨 지금 많이 힘들구나 💙 바로 <strong>청소년 상담 1388</strong> 또는 <strong>자살예방 1393</strong>에 전화해줘. 긴급 상황이면 112 또는 119!
        </div>
      ) : (
        <div className="alert-banner alert-safe">
          🔒 이 공간은 안전해요. 편하게 이야기해요.
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="msg-list">
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role === 'user' ? 'user' : ''}`}>
            {m.role === 'assistant' && <div className="msg-avatar-sm">🌸</div>}
            <div className="bubble-wrap">
              <div className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                {m.content}
              </div>
              <div className="bubble-time">{m.time}</div>
            </div>
          </div>
        ))}

        {/* 타이핑 인디케이터 */}
        {loading && (
          <div className="msg-row">
            <div className="msg-avatar-sm">🌸</div>
            <div className="typing-bubble">
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{COUNSELOR_NAME} 작성 중</span>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Keep-alive */}
      {keepAlive === 'toast' && (
        <div className="keepalive-toast">
          💭 생각 정리 중일까? 급하지 않아. 준비되면 한 줄만 적어줘.
        </div>
      )}
      {keepAlive === 'card' && (
        <div className="keepalive-card">
          <div className="keepalive-card-title">이어서 할까요?</div>
          <div className="keepalive-btns">
            {['1) 이어서 할게', '2) 오늘 요약 듣기', '3) 다음에 할래'].map(opt => (
              <button key={opt} className="keepalive-btn"
                onClick={() => { send(opt); setKeepAlive(null); }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 퀵 리플라이 */}
      <div className="quick-reply-row">
        {quickReplies.map(q => (
          <button key={q} className="qr-btn"
            onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>

      {/* 입력창 */}
      <div className="composer">
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="한 줄로 편하게 적어줘… (예: 친구 문제로 속상했어요)"
          disabled={loading}
        />
        <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 메인 앱
// ══════════════════════════════════════════════════════
export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [screen, setScreen] = useState('checkin');

  const handleCheckInDone = (info) => {
    setUserInfo(info);
    setScreen('chat');
  };

  const handleEnd = () => {
    setScreen('checkin');
    setUserInfo(null);
  };

  return (
    <div className="app-wrap">
      {screen === 'checkin' && <CheckInModal onDone={handleCheckInDone} />}
      {screen === 'chat' && userInfo && (
        <ChatScreen userInfo={userInfo} onEnd={handleEnd} />
      )}
      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--gray-400)', padding: '4px 0 8px' }}>
        {VERSION}
      </div>
    </div>
  );
}
