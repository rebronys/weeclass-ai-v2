const fetch = require('node-fetch');

const FALLBACKS = [
  '응, 잘 들었어! 좀 더 이야기해줄 수 있어? 😊',
  '그랬구나... 많이 힘들었겠다 💙',
  '네 마음이 느껴져. 어떤 부분이 제일 힘들어?',
  '잘 듣고 있어! 계속 이야기해줘 😌',
  '그 상황에서 어떤 기분이었어?',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // ── character 추가로 받기 ──────────────────────────────
  const { messages, grade, category, character } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
    });
  }

  try {
    // ── system 메시지 분리 ────────────────────────────────
    const chatMessages = (messages || []).filter(m => m.role !== 'system');

    // ── Gemini 형식 변환 ──────────────────────────────────
    let contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // ── 핵심 수정 1: 첫 항목이 model이면 제거 ────────────
    while (contents.length > 0 && contents[0].role === 'model') {
      contents = contents.slice(1);
    }

    // ── 핵심 수정 2: 빈 배열이면 기본값 넣기 ─────────────
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: '안녕' }] }];
    }

    // ── 핵심 수정 3: user/model 교대 순서 검증 ───────────
    // 연속된 같은 role이 있으면 Gemini 오류 발생 → 제거
    const fixed = [contents[0]];
    for (let i = 1; i < contents.length; i++) {
      if (contents[i].role !== fixed[fixed.length - 1].role) {
        fixed.push(contents[i]);
      }
    }
    contents = fixed;

    // ── 마지막이 반드시 user여야 함 ───────────────────────
    if (contents[contents.length - 1].role !== 'user') {
      contents = contents.slice(0, -1);
    }
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: '안녕' }] }];
    }

    // ── 캐릭터 말투 ───────────────────────────────────────
    const characterStyle = character
      ? `사용자가 선택한 캐릭터는 "${character.name}"(${character.type})야.
이 캐릭터의 분위기를 자연스럽게 대화에 살짝 반영해줘.`
      : '';

    // ── 시스템 프롬프트 ───────────────────────────────────
    const systemPrompt = `당신은 따뜻하고 사려 깊은 학교 상담 선생님입니다.
이름은 "위클래스 김윤정쌤"이에요.
${grade ? `지금 대화하는 학생은 초등학교 ${grade}이에요.` : ''}
${category ? `오늘 상담 주제는 "${category}"입니다.` : ''}

학생과 대화할 때 반드시 지켜야 할 원칙:

1. 공감 우선: 바로 조언하지 말고 먼저 학생의 감정에 공감하고 위로하세요.
2. 탐색 질문: 학생이 스스로 답을 찾도록 한 가지 질문만 하세요.
3. 대화 연결: 이전 대화를 반드시 기억하고 연결해서 대화하세요.
4. 자연스러운 반말: "~야", "~어", "~지" 구어체로 친근하게 대화해요.
5. 인사는 인사로: "안녕"하면 "안녕! 반가워 😊" 처럼 자연스럽게 받아줘요.
6. 짧고 따뜻하게: 2~4문장, 이모지 1~2개, 마지막에 질문 1개.
7. 위기 대응: 자해·자살 언급 시 즉시 "청소년 상담 전화 1388" 안내.

${characterStyle}

절대 금지: 매뉴얼 같은 딱딱한 말투, 목록 나열, 긴 설명.`;

    // ── Gemini API 호출 ───────────────────────────────────
    const body = {
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 400,
        topP: 0.95,
        topK: 50,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    // ── 디버그 로그 (Vercel 로그에서 확인 가능) ──────────
    console.log('Gemini 요청 contents 수:', contents.length);
    console.log('마지막 메시지 role:', contents[contents.length - 1]?.role);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    // ── 디버그: 오류 응답 확인 ────────────────────────────
    if (data.error) {
      console.error('Gemini API 오류:', JSON.stringify(data.error));
      return res.status(200).json({
        reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    }

    console.error('빈 응답:', JSON.stringify(data));
    return res.status(200).json({
      reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
    });

  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({
      reply: '잠깐, 선생님이 잠시 생각 중이야 💭 다시 한번 말해줄래?',
    });
  }
};
