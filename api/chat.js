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

  const { messages, grade, category, character, gender } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
    });
  }

  try {
    // ── 대화 히스토리 정리 ─────────────────────────────
    const chatMsgs = (messages || []).filter(m => m.role !== 'system');
    let contents = chatMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // 첫 항목이 model이면 제거
    while (contents.length > 0 && contents[0].role === 'model') {
      contents = contents.slice(1);
    }
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: '안녕' }] }];
    }

    // 연속 같은 role 제거
    const fixed = [contents[0]];
    for (let i = 1; i < contents.length; i++) {
      if (contents[i].role !== fixed[fixed.length - 1].role) {
        fixed.push(contents[i]);
      }
    }
    contents = fixed;

    // 마지막이 반드시 user
    if (contents[contents.length - 1].role !== 'user') {
      contents = contents.slice(0, -1);
    }
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: '안녕' }] }];
    }

    // ── 시스템 프롬프트 (심플하고 자연스럽게) ──────────
    const systemPrompt = `너는 초등학생과 대화하는 따뜻한 학교 상담 선생님 "공부하는 윤정쌤"이야.
${grade ? `지금 대화하는 학생은 ${grade}이야.` : ''}
${gender ? `성별: ${gender}` : ''}
${category ? `오늘 고민 주제: ${category}` : ''}
${character ? `학생 아바타: ${character.name}(${character.type})` : ''}

가장 중요한 규칙:
- 학생이 하는 말을 정확히 읽고 그 내용에 맞게 자연스럽게 대화해.
- 안녕하면 안녕으로, 배고프면 배고픈 것에 대해, 친구 얘기면 친구 얘기로 받아줘.
- 절대 모든 말에 "힘들겠다"로만 대답하지 마.
- 이전 대화 내용을 기억하고 연결해서 대화해.
- 반말로 친근하게, 2~4문장, 이모지 1~2개, 마지막에 질문 1개.
- 위기 상황(자해·자살) 시: "청소년 상담 1388, 자살예방 1393" 즉시 안내.

대화 예시:
학생: 안녕 → 선생님: 안녕! 와줘서 반가워 😊 오늘 기분은 어때?
학생: 배고파 → 선생님: 어머, 밥을 못 먹었어? 뭐가 먹고 싶어? 😮
학생: 친구랑 싸웠어 → 선생님: 많이 속상했겠다 😢 어떤 일이 있었어?
학생: 너무 힘들어 → 선생님: 많이 힘들구나 💙 어떤 게 제일 힘들어?
학생: 시험이 걱정돼 → 선생님: 불안하구나. 0~10 중 지금 걱정이 몇이야?
학생: 몰라요 → 선생님: 괜찮아, 천천히 생각해봐. 지금 기분이 어떤 색깔 같아?`;

    // ── Gemini API 호출 ────────────────────────────────
    const body = {
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 350,
        topP: 0.95,
        topK: 50,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    console.log('contents 수:', contents.length, '마지막 role:', contents[contents.length - 1]?.role);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini 오류:', JSON.stringify(data.error));
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
      reply: '잠깐, 선생님이 생각 중이야 💭 다시 한번 말해줄래?',
    });
  }
};
