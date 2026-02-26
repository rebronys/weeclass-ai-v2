import React, { useState, useEffect, useRef } from 'react';

const VERSION = 'v2.0 · 2026.02.26';
const COUNSELOR_NAME = '위클래스 김윤정쌤';
const SCHOOL_NAME = '마음이 따뜻한 온라인 위클래스 상담소';
const SUMMARY_INTERVAL = 5;

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];

const CATEGORIES = [
  { id: 1,  emoji: '😔', label: '우울·무기력' },
  { id: 2,  emoji: '😰', label: '불안·걱정' },
  { id: 3,  emoji: '😡', label: '분노·짜증' },
  { id: 4,  emoji: '👫', label: '친구관계' },
  { id: 5,  emoji: '👨‍👩‍👧', label: '가족문제' },
  { id: 6,  emoji: '📚', label: '학습·성적' },
  { id: 7,  emoji: '🏫', label: '학교생활' },
  { id: 8,  emoji: '🤝', label: '따돌림·괴롭힘' },
  { id: 9,  emoji: '📱', label: '스마트폰·게임' },
  { id: 10, emoji: '💤', label: '수면문제' },
  { id: 11, emoji: '🍽️', label: '식사문제' },
  { id: 12, emoji: '🤒', label: '신체증상' },
  { id: 13, emoji: '🔪', label: '자해·자살생각' },
  { id: 14, emoji: '💔', label: '이성·사랑' },
  { id: 15, emoji: '🌀', label: '정체성혼란' },
  { id: 16, emoji: '😶', label: '무기력·의욕없음' },
  { id: 17, emoji: '🏠', label: '가출·방황' },
  { id: 18, emoji: '💸', label: '돈·물질문제' },
  { id: 19, emoji: '🌧️', label: '상실·슬픔' },
  { id: 20, emoji: '💬', label: '기타고민' },
];

const MALE_CHARACTERS = [
  { name: '손흥민', emoji: '⚽', type: '운동선수' },
  { name: '류현진', emoji: '⚾', type: '운동선수' },
  { name: 'BTS 뷔', emoji: '🎤', type: '연예인' },
  { name: 'BTS 정국', emoji: '🎵', type: '연예인' },
  { name: '차은우', emoji: '✨', type: '연예인' },
  { name: '이강인', emoji: '🏅', type: '운동선수' },
  { name: '김민재', emoji: '🛡️', type: '운동선수' },
  { name: '황희찬', emoji: '🔥', type: '운동선수' },
  { name: '엑소 카이', emoji: '💫', type: '연예인' },
  { name: '강다니엘', emoji: '🌙', type: '연예인' },
];

const FEMALE_CHARACTERS = [
  { name: '아이유', emoji: '🌸', type: '연예인' },
  { name: '블랙핑크 지수', emoji: '💎', type: '연예인' },
  { name: '블랙핑크 리사', emoji: '💃', type: '연예인' },
  { name: '트와이스 나연', emoji: '🌟', type: '연예인' },
  { name: '김연아', emoji: '⛸️', type: '운동선수' },
  { name: '뉴진스 혜인', emoji: '🎀', type: '연예인' },
  { name: '에스파 카리나', emoji: '🤖', type: '연예인' },
  { name: '르세라핌 카즈하', emoji: '🌺', type: '연예인' },
  { name: '오마이걸 미미', emoji: '🦋', type: '연예인' },
  { name: '박세리', emoji: '⛳', type: '운동선수' },
];

const ANIMAL_CHARACTERS = [
  { name: '피카츄', emoji: '⚡', type: '포켓몬' },
  { name: '토토로', emoji: '🌿', type: '지브리' },
  { name: '라이언', emoji: '🦁', type: '카카오프렌즈' },
  { name: '어피치', emoji: '🍑', type: '카카오프렌즈' },
  { name: '춘식이', emoji: '🐱', type: '카카오프렌즈' },
  { name: '잔망루피', emoji: '🐰', type: '캐릭터' },
  { name: '뽀로로', emoji: '🐧', type: '애니메이션' },
  { name: '둘리', emoji: '🦕', type: '만화' },
  { name: '이브이', emoji: '🌈', type: '포켓몬' },
  { name: '시나모롤', emoji: '☁️', type: '산리오' },
];

const RISK_KEYWORDS = {
  high:   ['죽고싶', '자살', '자해', '죽어버릴', '사라지고싶', '목숨', '끊고싶'],
  medium: ['너무힘들', '아무도없', '혼자', '포기하고싶', '도망가고싶', '무섭', '괴로워'],
};

// ── 한국어 조사 처리 ──────────────────────────────────────────
function hasFinalConsonant(str) {
  if (!str) return false;
  const last = str[str.length - 1];
  const code = last.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}

function josa(name, type) {
  const h = hasFinalConsonant(name);
  const map = { 은는: h ? '은' : '는', 이가: h ? '이' : '가', 을를: h ? '을' : '를', 와과: h ? '과' : '와' };
  return map[type] || '';
}

// ── 시간대별 인사 (10가지) ──────────────────────────────────────
function getGreeting(name) {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const j = josa(name, '아야');
  let season = '';
  if (month >= 3 && month <= 5) season = '봄';
  else if (month >= 6 && month <= 8) season = '여름';
  else if (month >= 9 && month <= 11) season = '가을';
  else season = '겨울';

  const greetings = [
    `안녕! 나 ${COUNSELOR_NAME}이야 😊 오늘 어떤 마음으로 왔어?`,
    `${name}${j} 와줘서 너무 반가워! 오늘 하루는 어땠어?`,
    hour < 12
      ? `좋은 아침이야! 오늘 ${name}${j} 어떤 하루를 보냈으면 좋겠어? 😄`
      : hour < 18
      ? `${season}날씨처럼 네 마음도 따뜻하길 바라! 오늘 어떤 일이 있었어?`
      : `오늘 하루도 수고 많았어! 지금 기분은 어때? 🌙`,
    `여기 와줘서 고마워 💙 편하게 이야기해도 돼!`,
    `${name}, 잘 왔어! 선생님은 항상 네 편이야 😊`,
    `오늘 무슨 일이 있었는지 궁금한데, 이야기해줄 수 있어?`,
    `${season}에 여기 찾아온 거, 선생님은 정말 잘 했다고 생각해! 어떤 마음이야?`,
    `어서 와! 네 이야기를 들을 준비가 되어 있어 👂`,
    `오늘 네가 느끼는 감정, 뭐든 괜찮아. 함께 얘기해보자! 💬`,
    `${name}${j} 여기 온 것만으로도 용기 있는 거야! 어떤 이야기든 해봐 🌟`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// ── 위험도 감지 ────────────────────────────────────────────────
function getRiskLevel(text) {
  const t = text.replace(/\s/g, '');
  if (RISK_KEYWORDS.high.some(k => t.includes(k))) return 'high';
  if (RISK_KEYWORDS.medium.some(k => t.includes(k))) return 'medium';
  return 'none';
}

// ── 유사도 체크 (중복 답변 방지) ──────────────────────────────
function simpleSimilarity(a, b) {
  if (!a || !b) return 0;
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const inter = [...setA].filter(c => setB.has(c)).length;
  return inter / Math.max(setA.size, setB.size);
}

// ── AI 호출 (2초 딜레이 포함) ─────────────────────────────────
async function callAI(messages) {
  // 2초 딜레이 (생각하는 시간)
  await new Promise(resolve => setTimeout(resolve, 2000));
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || '조금 더 이야기해줄 수 있어요?';
  } catch {
    return '네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
  }
}

// ── 슬롯 추출 ─────────────────────────────────────────────────
async function extractSlots(userText, conversationHistory) {
  const prompt = [
    {
      role: 'system',
      content: `다음 학생 메시지에서 아래 슬롯을 JSON으로 추출하세요.
슬롯: subject(주제), emotion(감정), situation(상황), severity(심각도1-5)
없으면 null. 반드시 JSON만 반환.`,
    },
    ...conversationHistory.slice(-4),
    { role: 'user', content: userText },
  ];
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: prompt }),
    });
    const data = await res.json();
    const match = data.reply?.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return {};
}

// ── 롤링 요약 ─────────────────────────────────────────────────
async function generateRollingSummary(prevSummary, recentMessages) {
  const prompt = [
    {
      role: 'system',
      content: `이전 요약과 최근 대화를 합쳐 3문장 이내로 핵심만 요약하세요. 학생의 감정, 주요 고민, 중요 사실만 포함.`,
    },
    {
      role: 'user',
      content: `이전 요약: ${prevSummary || '없음'}\n\n최근 대화:\n${recentMessages.map(m => `${m.role === 'user' ? '학생' : '상담사'}: ${m.content}`).join('\n')}`,
    },
  ];
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: prompt }),
    });
    const data = await res.json();
    return data.reply || prevSummary;
  } catch {
    return prevSummary;
  }
}

// ── 사실 메모리 업데이트 ──────────────────────────────────────
function updateFactMemory(prev, slots) {
  const next = { ...prev };
  if (slots.subject) next.subject = slots.subject;
  if (slots.emotion) next.emotion = slots.emotion;
  if (slots.situation) next.situation = slots.situation;
  if (slots.severity) next.severity = slots.severity;
  return next;
}

// ── 시스템 프롬프트 빌드 ──────────────────────────────────────
function buildSystemPrompt(state) {
  const { category, grade, name, gender, rollingSummary, factMemory } = state;
  const genderText = gender === 'male' ? '남학생' : gender === 'female' ? '여학생' : '학생';

  return `당신은 ${SCHOOL_NAME}의 ${COUNSELOR_NAME}입니다.
상담 대상: ${grade || ''} ${genderText}, 닉네임 "${name}", 고민 분야: ${category}

[상담 원칙 - 한국 학교상담 기반]
1. 반영(Reflection): 학생의 말을 그대로 반영하여 공감 표현
2. 명료화(Clarification): 모호한 감정·상황을 명확히 질문
3. 재구성(Reframing): 부정적 시각을 긍정적으로 재해석
4. 감정 반영(Emotion Reflection): 감정을 구체적으로 명명
5. 강점 중심(Strength-Based): 학생의 강점과 자원 발견
6. 단계적 탐색: 한 번에 하나의 질문만 함
7. 비심판적 태도: 절대 비난하지 않음
8. 초등학생 눈높이: 쉬운 단어, 짧은 문장, 따뜻한 말투

[대화 맥락 이해 규칙]
- 이전 대화 내용을 반드시 참고하여 연속성 있게 답변
- 학생이 언급한 사람, 사건, 감정을 기억하고 활용
- 같은 질문 반복 금지
- 학생 말의 핵심 감정을 먼저 공감한 뒤 탐색 질문

[응답 형식]
- 2~4문장 이내
- 이모지 1~2개 자연스럽게 포함
- 반말 사용 (친근하게)
- 마지막에 탐색 질문 1개

${rollingSummary ? `[지금까지 대화 요약]\n${rollingSummary}` : ''}
${factMemory.subject ? `[파악된 정보] 주제: ${factMemory.subject}, 감정: ${factMemory.emotion || '미파악'}, 심각도: ${factMemory.severity || '미파악'}/5` : ''}

[위험 신호 대응]
자해·자살 관련 발언 시: 즉시 "선생님한테 직접 도움을 요청해줘. 학교 위클래스(내선 ___) 또는 청소년상담 1388로 연락해!" 안내
`;
}

// ══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [step, setStep] = useState('home');
  const [category, setCategory] = useState('');
  const [grade, setGrade] = useState('');
  const [character, setCharacter] = useState(null);
  const [gender, setGender] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [riskAlert, setRiskAlert] = useState('none');
  const [rollingSummary, setRollingSummary] = useState('');
  const [factMemory, setFactMemory] = useState({});
  const [lastBotMsg, setLastBotMsg] = useState('');
  const [thinkingDots, setThinkingDots] = useState('');
  const bottomRef = useRef(null);

  // 스크롤 자동 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 생각 중 애니메이션
  useEffect(() => {
    if (!loading) return;
    const frames = ['생각 중.', '생각 중..', '생각 중...'];
    let i = 0;
    const timer = setInterval(() => {
      setThinkingDots(frames[i % frames.length]);
      i++;
    }, 500);
    return () => clearInterval(timer);
  }, [loading]);

  // ── 채팅 시작 ─────────────────────────────────────────────
  const startChat = async () => {
    const name = character?.name || '친구';
    const greeting = getGreeting(name);
    setMessages([{ role: 'assistant', content: greeting }]);
    setLastBotMsg(greeting);
    setStep('chat');
  };

  // ── 메시지 전송 & AI 응답 처리 ───────────────────────────
  const processAndSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // 위험도 감지
    const risk = getRiskLevel(text);
    if (risk !== 'none') setRiskAlert(risk);

    // 슬롯 추출 (비동기, 백그라운드)
    extractSlots(text, messages).then(slots => {
      if (Object.keys(slots).length > 0) {
        setFactMemory(prev => updateFactMemory(prev, slots));
      }
    });

    // 롤링 요약 (5턴마다)
    let currentSummary = rollingSummary;
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    if (newTurn % SUMMARY_INTERVAL === 0) {
      const recent = newMessages.slice(-SUMMARY_INTERVAL * 2);
      currentSummary = await generateRollingSummary(rollingSummary, recent);
      setRollingSummary(currentSummary);
    }

    // 시스템 프롬프트 구성
    const systemPrompt = buildSystemPrompt({
      category,
      grade,
      name: character?.name || '친구',
      gender,
      rollingSummary: currentSummary,
      factMemory,
    });

    // AI 호출용 메시지 배열 구성 (최근 12턴 + 시스템)
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...newMessages.slice(-12),
    ];

    // AI 호출 (2초 딜레이 포함)
    const reply = await callAI(apiMessages);

    // 중복 답변 방지
    const finalReply =
      simpleSimilarity(reply, lastBotMsg) > 0.7
        ? reply + ' 오늘 어떤 마음이 가장 크게 느껴져?'
        : reply;

    setLastBotMsg(finalReply);
    setMessages(prev => [...prev, { role: 'assistant', content: finalReply }]);
    setLoading(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processAndSend();
    }
  };

  // ══════════════════════════════════════════════════════════
  // 스타일
  // ══════════════════════════════════════════════════════════
  const S = {
    wrap: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f4fd 0%, #fce4ec 50%, #f3e5f5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Noto Sans KR', sans-serif",
      padding: '16px',
    },
    card: {
      background: 'rgba(255,255,255,0.92)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      padding: '28px 24px',
      width: '100%',
      maxWidth: '480px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#3d5af1',
      textAlign: 'center',
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '13px',
      color: '#888',
      textAlign: 'center',
      marginBottom: '20px',
    },
    sectionLabel: {
      fontSize: '15px',
      fontWeight: '700',
      color: '#555',
      marginBottom: '12px',
      marginTop: '16px',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginBottom: '8px',
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      marginBottom: '8px',
    },
    grid4: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '12px',
    },
    btn: (active) => ({
      padding: '10px 8px',
      borderRadius: '12px',
      border: active ? '2.5px solid #3d5af1' : '1.5px solid #ddd',
      background: active ? '#eef0ff' : '#fafafa',
      color: active ? '#3d5af1' : '#555',
      fontWeight: active ? '700' : '500',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      textAlign: 'center',
    }),
    charBtn: (active) => ({
      padding: '12px 8px',
      borderRadius: '14px',
      border: active ? '2.5px solid #e91e8c' : '1.5px solid #ddd',
      background: active ? '#fce4ec' : '#fafafa',
      color: active ? '#c2185b' : '#555',
      fontWeight: active ? '700' : '500',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      textAlign: 'center',
    }),
    nextBtn: {
      width: '100%',
      padding: '14px',
      borderRadius: '14px',
      border: 'none',
      background: 'linear-gradient(90deg, #3d5af1, #e91e8c)',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '800',
      cursor: 'pointer',
      marginTop: '16px',
      letterSpacing: '1px',
    },
    chatWrap: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '480px',
      width: '100%',
      margin: '0 auto',
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '0',
    },
    chatHeader: {
      background: 'linear-gradient(90deg, #3d5af1, #e91e8c)',
      color: '#fff',
      padding: '16px 20px',
      fontSize: '15px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    msgList: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    msgBot: {
      alignSelf: 'flex-start',
      background: '#eef0ff',
      color: '#333',
      borderRadius: '18px 18px 18px 4px',
      padding: '12px 16px',
      maxWidth: '80%',
      fontSize: '14px',
      lineHeight: '1.6',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    msgUser: {
      alignSelf: 'flex-end',
      background: 'linear-gradient(135deg, #3d5af1, #e91e8c)',
      color: '#fff',
      borderRadius: '18px 18px 4px 18px',
      padding: '12px 16px',
      maxWidth: '80%',
      fontSize: '14px',
      lineHeight: '1.6',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    thinking: {
      alignSelf: 'flex-start',
      background: '#f0f0f0',
      color: '#888',
      borderRadius: '18px 18px 18px 4px',
      padding: '10px 16px',
      fontSize: '13px',
      fontStyle: 'italic',
    },
    inputArea: {
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      borderTop: '1px solid #eee',
      background: '#fff',
    },
    textarea: {
      flex: 1,
      borderRadius: '20px',
      border: '1.5px solid #ddd',
      padding: '10px 16px',
      fontSize: '14px',
      resize: 'none',
      outline: 'none',
      lineHeight: '1.5',
      fontFamily: "'Noto Sans KR', sans-serif",
    },
    sendBtn: {
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      border: 'none',
      background: 'linear-gradient(135deg, #3d5af1, #e91e8c)',
      color: '#fff',
      fontSize: '18px',
      cursor: 'pointer',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    riskHigh: {
      background: '#ffebee',
      border: '2px solid #f44336',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#c62828',
      fontSize: '13px',
      fontWeight: '700',
      margin: '0 16px 8px',
    },
    riskMedium: {
      background: '#fff8e1',
      border: '2px solid #ffb300',
      borderRadius: '12px',
      padding: '10px 16px',
      color: '#e65100',
      fontSize: '13px',
      margin: '0 16px 8px',
    },
    factChips: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      padding: '6px 16px',
    },
    chip: {
      background: '#eef0ff',
      color: '#3d5af1',
      borderRadius: '20px',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: '600',
    },
    version: {
      textAlign: 'center',
      fontSize: '11px',
      color: '#aaa',
      padding: '6px',
    },
  };

  // ══════════════════════════════════════════════════════════
  // 렌더링
  // ══════════════════════════════════════════════════════════

  // ── 홈 화면 (카테고리 선택) ──────────────────────────────
  if (step === 'home') {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.title}>💙 {SCHOOL_NAME}</div>
          <div style={S.subtitle}>{COUNSELOR_NAME} · {VERSION}</div>
          <div style={S.sectionLabel}>📌 어떤 고민이 있어요?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                style={S.btn(category === c.label)}
                onClick={() => setCategory(c.label)}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <button
            style={{ ...S.nextBtn, opacity: category ? 1 : 0.5 }}
            disabled={!category}
            onClick={() => category && setStep('grade')}
          >
            다음 →
          </button>
        </div>
      </div>
    );
  }

  // ── 학년 선택 ────────────────────────────────────────────
  if (step === 'grade') {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.title}>💙 {SCHOOL_NAME}</div>
          <div style={S.subtitle}>고민: {category}</div>
          <div style={S.sectionLabel}>🏫 몇 학년이에요?</div>
          <div style={S.grid3}>
            {GRADES.map(g => (
              <button
                key={g}
                style={S.btn(grade === g)}
                onClick={() => setGrade(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            style={{ ...S.nextBtn, opacity: grade ? 1 : 0.5 }}
            disabled={!grade}
            onClick={() => grade && setStep('character')}
          >
            다음 →
          </button>
        </div>
      </div>
    );
  }

  // ── 캐릭터 선택 ──────────────────────────────────────────
  if (step === 'character') {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.title}>💙 {SCHOOL_NAME}</div>
          <div style={S.subtitle}>{grade} · {category}</div>
          <div style={S.sectionLabel}>🎭 나를 대신해서 표현하고 싶은 캐릭터를 선택해주세요!</div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: '#3d5af1', margin: '8px 0 6px' }}>
            🎤 남성 연예인 · 운동선수
          </div>
          <div style={S.grid4}>
            {MALE_CHARACTERS.map(c => (
              <button
                key={c.name}
                style={S.charBtn(character?.name === c.name)}
                onClick={() => setCharacter(c)}
              >
                {c.emoji} {c.name}
                <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{c.type}</div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e91e8c', margin: '12px 0 6px' }}>
            🌸 여성 연예인 · 운동선수
          </div>
          <div style={S.grid4}>
            {FEMALE_CHARACTERS.map(c => (
              <button
                key={c.name}
                style={S.charBtn(character?.name === c.name)}
                onClick={() => setCharacter(c)}
              >
                {c.emoji} {c.name}
                <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{c.type}</div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: '#43a047', margin: '12px 0 6px' }}>
            🐾 만화 · 애니메이션 캐릭터
          </div>
          <div style={S.grid4}>
            {ANIMAL_CHARACTERS.map(c => (
              <button
                key={c.name}
                style={S.charBtn(character?.name === c.name)}
                onClick={() => setCharacter(c)}
              >
                {c.emoji} {c.name}
                <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{c.type}</div>
              </button>
            ))}
          </div>

          <button
            style={{ ...S.nextBtn, opacity: character ? 1 : 0.5 }}
            disabled={!character}
            onClick={() => character && setStep('gender')}
          >
            다음 →
          </button>
        </div>
      </div>
    );
  }

  // ── 성별 선택 ────────────────────────────────────────────
  if (step === 'gender') {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.title}>💙 {SCHOOL_NAME}</div>
          <div style={S.subtitle}>
            {character?.emoji} {character?.name} · {grade}
          </div>
          <div style={S.sectionLabel}>👤 성별을 알려줘요</div>
          <div style={S.grid3}>
            {[
              { val: 'male',   label: '남자예요', emoji: '👦' },
              { val: 'female', label: '여자예요', emoji: '👧' },
              { val: 'secret', label: '비밀이에요', emoji: '🤐' },
            ].map(g => (
              <button
                key={g.val}
                style={S.btn(gender === g.val)}
                onClick={() => setGender(g.val)}
              >
                {g.emoji}<br />{g.label}
              </button>
            ))}
          </div>
          <button
            style={{ ...S.nextBtn, opacity: gender ? 1 : 0.5 }}
            disabled={!gender}
            onClick={() => gender && startChat()}
          >
            상담 시작! 💙
          </button>
        </div>
      </div>
    );
  }

  // ── 채팅 화면 ────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      <div style={S.chatWrap}>
        {/* 헤더 */}
        <div style={S.chatHeader}>
          <span style={{ fontSize: '22px' }}>💙</span>
          <div>
            <div>{COUNSELOR_NAME}</div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>
              {character?.emoji} {character?.name} · {grade} · {category}
            </div>
          </div>
        </div>

        {/* 위험 알림 */}
        {riskAlert === 'high' && (
          <div style={S.riskHigh}>
            🚨 지금 많이 힘들구나. 선생님한테 바로 도움 요청해줘! 청소년상담 ☎ 1388
          </div>
        )}
        {riskAlert === 'medium' && (
          <div style={S.riskMedium}>
            💛 많이 힘들지? 선생님이 옆에 있어. 언제든 1388로 전화해도 돼.
          </div>
        )}

        {/* 사실 메모 칩 */}
        {Object.keys(factMemory).length > 0 && (
          <div style={S.factChips}>
            {factMemory.subject && <span style={S.chip}>📌 {factMemory.subject}</span>}
            {factMemory.emotion && <span style={S.chip}>💭 {factMemory.emotion}</span>}
            {factMemory.severity && <span style={S.chip}>⚡ 심각도 {factMemory.severity}/5</span>}
          </div>
        )}

        {/* 메시지 목록 */}
        <div style={S.msgList}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === 'user' ? S.msgUser : S.msgBot}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={S.thinking}>
              {COUNSELOR_NAME} {thinkingDots} 💭
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div style={S.inputArea}>
          <textarea
            style={S.textarea}
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이야기를 들려줘요... (Enter: 전송)"
            disabled={loading}
          />
          <button
            style={{ ...S.sendBtn, opacity: loading ? 0.5 : 1 }}
            onClick={processAndSend}
            disabled={loading}
          >
            ➤
          </button>
        </div>

        <div style={S.version}>{VERSION} · {SCHOOL_NAME}</div>
      </div>
    </div>
  );
}
