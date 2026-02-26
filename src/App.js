import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const SERVICE_NAME = '은평초등학교 위클래스';
const COUNSELOR_NAME = '공부하는 윤정쌤';

const GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const GENDERS = ['남자','여자','비공개'];
const CATEGORIES = [
  '친구 관계','학교생활','가족 이야기','공부·성적',
  '기분·감정','선생님','외모·몸','게임·유튜브',
  '진로·꿈','그냥 수다',
];
const AVATARS = {
  남자: [
    { name: '손흥민', emoji: '⚽', type: '남자' },
    { name: '유재석', emoji: '😄', type: '남자' },
    { name: '마동석', emoji: '💪', type: '남자' },
    { name: 'BTS뷔', emoji: '🎤', type: '남자' },
    { name: '이순신', emoji: '⚓', type: '남자' },
    { name: '홍길동', emoji: '🦸', type: '남자' },
  ],
  여자: [
    { name: '아이유', emoji: '🎵', type: '여자' },
    { name: '태연', emoji: '🌟', type: '여자' },
    { name: '고윤정', emoji: '🌸', type: '여자' },
    { name: '김연아', emoji: '⛸️', type: '여자' },
    { name: '박세리', emoji: '⛳', type: '여자' },
    { name: '전지현', emoji: '💫', type: '여자' },
  ],
  캐릭터: [
    { name: '뽀로로', emoji: '🐧', type: '캐릭터' },
    { name: '엘사', emoji: '❄️', type: '캐릭터' },
    { name: '니모', emoji: '🐠', type: '캐릭터' },
    { name: '번개맨', emoji: '⚡', type: '캐릭터' },
    { name: '신데렐라', emoji: '👑', type: '캐릭터' },
    { name: '슛돌이', emoji: '🥅', type: '캐릭터' },
  ],
};

const RISK_KEYWORDS = ['죽고싶','자살','자해','사라지고싶','죽어버릴','없어지고싶'];

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

/* ── Step 1: 학년 선택 ── */
function StepGrade({ onSelect }) {
  return (
    <div className="step-wrap">
      <div className="step-header">
        <span className="step-logo">💬</span>
        <h1 className="step-title">{SERVICE_NAME}</h1>
        <p className="step-sub">안녕! 몇 학년이야?</p>
      </div>
      <div className="grade-grid">
        {GRADES.map(g => (
          <button key={g} className="rect-btn" onClick={() => onSelect(g)}>{g}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: 성별 선택 ── */
function StepGender({ grade, onSelect }) {
  return (
    <div className="step-wrap">
      <div className="step-header">
        <span className="step-logo">💬</span>
        <p className="step-grade-badge">{grade}</p>
        <p className="step-sub">나는 어떤 성별이야?</p>
      </div>
      <div className="gender-grid">
        {GENDERS.map(g => (
          <button key={g} className="rect-btn" onClick={() => onSelect(g)}>{g}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: 고민 유형 선택 ── */
function StepCategory({ grade, onSelect }) {
  return (
    <div className="step-wrap">
      <div className="step-header">
        <span className="step-logo">💬</span>
        <p className="step-grade-badge">{grade}</p>
        <p className="step-sub">오늘 어떤 이야기 하고 싶어?</p>
      </div>
      <div className="category-grid">
        {CATEGORIES.map(c => (
          <button key={c} className="rect-btn" onClick={() => onSelect(c)}>{c}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 4: 아바타 선택 ── */
function StepAvatar({ gender, onSelect }) {
  const tabs = ['남자', '여자', '캐릭터'];
  const defaultTab = gender === '남자' ? '남자' : gender === '여자' ? '여자' : '캐릭터';
  const [tab, setTab] = useState(defaultTab);
  return (
    <div className="step-wrap">
      <div className="step-header">
        <span className="step-logo">💬</span>
        <p className="step-sub">나를 대신할 아바타를 선택해줘!</p>
      </div>
      <div className="tab-row">
        {tabs.map(t => (
          <button
            key={t}
            className={`tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>
      <div className="avatar-grid">
        {AVATARS[tab].map(av => (
          <button key={av.name} className="avatar-card" onClick={() => onSelect(av)}>
            <span className="avatar-emoji">{av.emoji}</span>
            <span className="avatar-name">{av.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 5: 채팅 입장 확인 ── */
function StepStart({ userInfo, onStart }) {
  return (
    <div className="step-wrap">
      <div className="step-header">
        <span className="step-logo avatar-large">
          {userInfo.avatar ? userInfo.avatar.emoji : '💬'}
        </span>
        <h2 className="step-title">
          {userInfo.avatar ? userInfo.avatar.name : '친구'}으로 입장!
        </h2>
        <div className="info-chips">
          <span className="chip">{userInfo.grade}</span>
          <span className="chip">{userInfo.gender}</span>
          <span className="chip">{userInfo.category}</span>
        </div>
        <p className="step-sub">{COUNSELOR_NAME}이 기다리고 있어 😊</p>
      </div>
      <button className="start-btn" onClick={onStart}>채팅 시작하기 💬</button>
    </div>
  );
}

/* ── ChatScreen ── */
function ChatScreen({ userInfo, onEnd }) {
  const welcomeMsg = userInfo.avatar
    ? `안녕! 나는 ${COUNSELOR_NAME}이야 😊\n${userInfo.avatar.emoji} ${userInfo.avatar.name}으로 왔구나!\n${userInfo.category ? `"${userInfo.category}" 이야기 하고 싶어? 편하게 말해줘 💙` : '편하게 이야기해줘 💙'}`
    : `안녕! 나는 ${COUNSELOR_NAME}이야 😊\n편하게 이야기해줘 💙`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: welcomeMsg, time: getTime() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [risk, setRisk] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const QUICK = ['안녕!', '오늘 힘들었어', '친구랑 싸웠어', '학교 재밌었어', '배고파'];

  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    if (detectRisk(trimmed)) setRisk(true);

    const userMsg = { role: 'user', content: trimmed, time: getTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
    const reply = await callAI(apiMessages, userInfo);
    setMessages(prev => [...prev, { role: 'assistant', content: reply, time: getTime() }]);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="chat-wrap">
      <div className="chat-header">
        <button className="back-btn" onClick={onEnd}>←</button>
        <div className="chat-header-info">
          <span className="chat-avatar-icon">
            {userInfo.avatar ? userInfo.avatar.emoji : '💬'}
          </span>
          <div>
            <div className="chat-header-name">{COUNSELOR_NAME}</div>
            <div className="chat-header-sub">{userInfo.grade} · {userInfo.category}</div>
          </div>
        </div>
      </div>

      {risk && (
        <div className="risk-banner">
          ⚠️ 청소년 상담 <strong>1388</strong> · 자살예방 <strong>1393</strong> (24시간 무료)
        </div>
      )}

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role}`}>
            {m.role === 'assistant' && (
              <div className="bubble-avatar">
                {userInfo.avatar ? userInfo.avatar.emoji : '💬'}
              </div>
            )}
            <div className="bubble-col">
              <div className={`bubble ${m.role}`}>{m.content}</div>
              <div className="bubble-time">{m.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="bubble-row assistant">
            <div className="bubble-avatar">
              {userInfo.avatar ? userInfo.avatar.emoji : '💬'}
            </div>
            <div className="bubble-col">
              <div className="bubble assistant thinking">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="quick-row">
        {QUICK.map(q => (
          <button key={q} className="quick-btn" onClick={() => sendMessage(q)}>{q}</button>
        ))}
      </div>

      <div className="chat-composer">
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="메시지를 입력해줘..."
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >전송</button>
      </div>
    </div>
  );
}

/* ── 메인 App ── */
export default function App() {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [avatar, setAvatar] = useState(null);

  const userInfo = { grade, gender, category, avatar };

  function reset() {
    setStep(1); setGrade(''); setGender(''); setCategory(''); setAvatar(null);
  }

  if (step === 6) {
    return (
      <div className="app-wrap">
        <ChatScreen userInfo={userInfo} onEnd={reset} />
      </div>
    );
  }

  return (
    <div className="app-wrap">
      {step === 1 && <StepGrade onSelect={v => { setGrade(v); setStep(2); }} />}
      {step === 2 && <StepGender grade={grade} onSelect={v => { setGender(v); setStep(3); }} />}
      {step === 3 && <StepCategory grade={grade} onSelect={v => { setCategory(v); setStep(4); }} />}
      {step === 4 && <StepAvatar gender={gender} onSelect={v => { setAvatar(v); setStep(5); }} />}
      {step === 5 && <StepStart userInfo={userInfo} onStart={() => setStep(6)} />}
    </div>
  );
}