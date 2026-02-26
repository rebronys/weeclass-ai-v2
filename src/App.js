import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const SERVICE_NAME = '은평초등학교 위클래스';
const COUNSELOR_NAME = '공부하는 윤정쌤';
const VERSION = 'v3.2 · 2026.02.26';

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];
const GENDERS = ['남자', '여자', '비공개'];

const CATEGORIES = [
  '친구와의 다툼', '따돌림·괴롭힘', '새 친구 사귀기',
  '공부·숙제 스트레스', '시험 불안', '집중이 안 돼요',
  '스마트폰·게임 고민', '화·감정조절', '슬픔·우울',
  '막연한 걱정·불안', '학교 가기 싫음', '선생님과의 관계',
  '발표·수업 두려움', '가족 갈등', '형제·자매 갈등',
  '전학·새 학기 적응', '몸이 자주 아파요', '자존감·외모',
  '사이버폭력', '그냥 이야기하고 싶어요',
];

const AVATARS = {
  남자: [
    { name: '손흥민', emoji: '⚽' },
    { name: '유재석', emoji: '🎭' },
    { name: '마동석', emoji: '💪' },
    { name: 'BTS 뷔', emoji: '🎤' },
    { name: '이순신', emoji: '⚓' },
    { name: '홍길동', emoji: '🦸' },
  ],
  여자: [
    { name: '아이유', emoji: '🌸' },
    { name: '태연', emoji: '🎵' },
    { name: '고윤정', emoji: '✨' },
    { name: '김연아', emoji: '⛸️' },
    { name: '박세리', emoji: '⛳' },
    { name: '전지현', emoji: '💫' },
  ],
  캐릭터: [
    { name: '뽀로로', emoji: '🐧' },
    { name: '엘사', emoji: '❄️' },
    { name: '니모', emoji: '🐠' },
    { name: '번개맨', emoji: '⚡' },
    { name: '신데렐라', emoji: '👠' },
    { name: '슛돌이', emoji: '🥅' },
  ],
};

const RISK_KEYWORDS = ['죽고싶', '자살', '자해', '사라지고싶', '죽어버릴'];

function detectRisk(text) {
  return RISK_KEYWORDS.some(k => text.replace(/\s/g, '').includes(k));
}

function getTime() {
  const n = new Date();
  return `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`;
}

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
      .then(d => d.reply || '조금 더 이야기해줄 수 있어? 😊')
      .catch(() => '연결이 잠깐 끊겼어. 다시 보내줄래? 💙'),
    new Promise(r => setTimeout(r, 2000)),
  ]);
  return reply;
}

// ── 스텝 컴포넌트들 ────────────────────────────────

function StepGrade({ value, onChange, onNext }) {
  return (
    <div className="step-screen">
      <div className="step-hero">
        <div className="step-logo">🏫</div>
        <div className="step-title">몇 학년이에요?</div>
        <div className="step-sub">학년에 맞게 대화할게요</div>
      </div>
      <div className="grade-grid">
        {GRADES.map(g => (
          <button
            key={g}
            className={`rect-btn ${value === g ? 'active' : ''}`}
            onClick={() => onChange(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <button className="btn-next" disabled={!value} onClick={onNext}>
        다음 →
      </button>
    </div>
  );
}

function StepGender({ value, onChange, onNext, onBack }) {
  return (
    <div className="step-screen">
      <div className="step-hero">
        <div className="step-logo">👤</div>
        <div className="step-title">성별을 알려줘요</div>
        <div className="step-sub">말하기 싫으면 비공개로 해도 돼요</div>
      </div>
      <div className="gender-grid">
        {GENDERS.map(g => (
          <button
            key={g}
            className={`rect-btn large ${value === g ? 'active' : ''}`}
            onClick={() => onChange(g)}
          >
            {g === '남자' ? '👦' : g === '여자' ? '👧' : '🤐'}<br />
            <span>{g}</span>
          </button>
        ))}
      </div>
      <button className="btn-next" disabled={!value} onClick={onNext}>
        다음 →
      </button>
      <button className="btn-back" onClick={onBack}>← 이전</button>
    </div>
  );
}

function StepCategory({ value, onChange, onNext, onBack }) {
  return (
    <div className="step-screen">
      <div className="step-hero">
        <div className="step-logo">💬</div>
        <div className="step-title">오늘 어떤 이야기를<br />하고 싶어요?</div>
        <div className="step-sub">가장 가까운 것을 골라줘요</div>
      </div>
      <div className="category-grid">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`rect-btn small ${value === c ? 'active' : ''}`}
            onClick={() => onChange(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <button className="btn-next" disabled={!value} onClick={onNext}>
        다음 →
      </button>
      <button className="btn-back" onClick={onBack}>← 이전</button>
    </div>
  );
}

function StepAvatar({ value, onChange, onNext, onBack }) {
  const [tab, setTab] = useState('남자');
  return (
    <div className="step-screen">
      <div className="step-hero">
        <div className="step-logo">🎭</div>
        <div className="step-title">나를 대신할<br />아바타를 골라요!</div>
        <div className="step-sub">대화할 때 이 캐릭터로 표현돼요</div>
      </div>
      <div className="avatar-tabs">
        {['남자', '여자', '캐릭터'].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="avatar-grid">
        {AVATARS[tab].map(a => (
          <button
            key={a.name}
            className={`avatar-card ${value?.name === a.name ? 'active' : ''}`}
            onClick={() => onChange(a)}
          >
            <span className="avatar-emoji">{a.emoji}</span>
            <span className="avatar-name">{a.name}</span>
          </button>
        ))}
      </div>
      <button className="btn-next" disabled={!value} onClick={onNext}>
        다음 →
      </button>
      <button className="btn-back" onClick={onBack}>← 이전</button>
    </div>
  );
}

function StepStart({ userInfo, onStart, onBack }) {
  return (
    <div className="step-screen">
      <div className="step-hero" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="step-logo" style={{ fontSize: 48 }}>🌸</div>
        <div className="step-title">{SERVICE_NAME}</div>
        <div className="step-sub" style={{ marginTop: 8 }}>
          {COUNSELOR_NAME}이 기다리고 있어요
        </div>
        <div className="summary-card">
          <div className="summary-row">
            <span className="summary-label">학년</span>
            <span className="summary-value">{userInfo.grade}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">성별</span>
            <span className="summary-value">{userInfo.gender}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">주제</span>
            <span className="summary-value">{userInfo.category}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">아바타</span>
            <span className="summary-value">
              {userInfo.avatar?.emoji} {userInfo.avatar?.name}
            </span>
          </div>
        </div>
        <div className="privacy-note">
          🔒 이름·주소 등 개인정보는 묻지 않아요.<br />
          위험한 상황이면 "도와줘"라고 알려주세요.
        </div>
      </div>
      <button className="btn-next" onClick={onStart}>
        💙 채팅 시작하기
      </button>
      <button className="btn-back" onClick={onBack}>← 이전</button>
    </div>
  );
}

// ── 채팅 화면 ──────────────────────────────────────
function ChatScreen({ userInfo, onEnd }) {
  const welcome = `안녕! ${userInfo.avatar?.emoji} ${userInfo.avatar?.name}로 들어왔구나 😊\n${userInfo.grade} ${userInfo.gender !== '비공개' ? userInfo.gender + ' ' : ''}친구, 반가워!\n\n오늘 "${userInfo.category}" 이야기 하고 싶다고 했는데, 편하게 말해줘. 여기선 뭐든 괜찮아 💙`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: welcome, time: getTime() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [risk, setRisk] = useState(false);
  const [dots, setDots] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) { setDots(''); return; }
    let i = 0;
    const t = setInterval(() => {
      setDots(['·', '··', '···'][i++ % 3]);
    }, 500);
    return () => clearInterval(t);
  }, [loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    if (detectRisk(msg)) setRisk(true);

    const userMsg = { role: 'user', content: msg, time: getTime() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
    const reply = await callAI(apiMsgs, userInfo);

    setMessages(prev => [...prev, { role: 'assistant', content: reply, time: getTime() }]);
    setLoading(false);
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const QUICK = ['😊 기분 좋아요', '😔 힘들어요', '😡 화나요', '😰 불안해요', '💬 그냥 얘기하고 싶어요'];

  return (
    <div className="chat-wrap">
      <div className="chat-bg" />

      <div className="chat-header">
        <div className="chat-avatar-wrap">🌸</div>
        <div>
          <div className="chat-header-org">{SERVICE_NAME}</div>
          <div className="chat-header-name">{COUNSELOR_NAME}</div>
          <div className="chat-header-status">
            <span className="status-dot" /> 대화 중
          </div>
        </div>
        <button className="btn-end-session" onClick={onEnd}>나가기</button>
      </div>

      {risk && (
        <div className="alert-banner alert-danger">
          💙 많이 힘들구나. <strong>청소년 상담 1388</strong> 또는 <strong>자살예방 1393</strong>에 전화해줘. 긴급 시 112·119!
        </div>
      )}

      <div className="msg-list">
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role === 'user' ? 'user' : ''}`}>
            {m.role === 'assistant' && <div className="msg-avatar-sm">🌸</div>}
            <div className="bubble-wrap">
              <div className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                {m.content}
              </div>
              <div className="bubble-time"
                style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.time}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg-row">
            <div className="msg-avatar-sm">🌸</div>
            <div className="typing-bubble">
              <span style={{ fontSize: 12 }}>{COUNSELOR_NAME} 작성 중</span>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="quick-reply-row">
        {QUICK.map(q => (
          <button key={q} className="qr-btn" onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="composer">
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="편하게 이야기해줘… (Enter: 전송)"
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--gray-400)', padding: '4px 0 8px' }}>
        {VERSION}
      </div>
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [avatar, setAvatar] = useState(null);

  const userInfo = { grade, gender, category, avatar };

  if (step === 6) {
    return (
      <div className="app-wrap">
        <ChatScreen
          userInfo={userInfo}
          onEnd={() => {
            setStep(1);
            setGrade(''); setGender('');
            setCategory(''); setAvatar(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-wrap">
      {step === 1 && (
        <StepGrade
          value={grade}
          onChange={setGrade}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepGender
          value={gender}
          onChange={setGender}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepCategory
          value={category}
          onChange={setCategory}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepAvatar
          value={avatar}
          onChange={setAvatar}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <StepStart
          userInfo={userInfo}
          onStart={() => setStep(6)}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}
