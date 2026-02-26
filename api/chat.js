const fetch = require('node-fetch');

const FALLBACKS = [
  '응! 좀 더 이야기해줄 수 있어? 😊',
  '그랬구나 💙 어떤 기분이었어?',
  '잘 듣고 있어! 계속 말해줘 😌',
  '그 상황에서 어떤 생각이 들었어?',
  '천천히 말해줘도 괜찮아 💙',
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

    // ── 핵심: 최소한의 페르소나만 설정 ───────────────────
    // Gemini 본연의 대화 능력을 최대한 살림
    const systemPrompt = `너의 이름은 "공부하는 윤정쌤"이야.
너는 지금 초등학생과 카카오톡처럼 자연스럽게 채팅하고 있어.
${grade ? `상대방은 ${grade} 학생이야.` : ''}
${gender && gender !== '비공개' ? `성별은 ${gender}이야.` : ''}
${category ? `오늘 이야기하고 싶은 주제는 "${category}"야.` : ''}
${character ? `학생은 "${character.name}" 아바타를 선택했어.` : ''}

너는 Gemini야. 평소에 사람들과 대화하던 것처럼 똑같이 자연스럽게 대화해줘.
단지 아래 3가지만 지켜줘:

1. 학생이 하는 말을 그대로 이해하고 그에 맞게 바로 반응해줘.
   (배고프다 → 배고픔에 반응, 친구 얘기 → 친구 얘기로 반응)
2. 반말로 친근하게, 너무 길지 않게 대화해줘.
3. 자해·자살 언급 시에만 "청소년 상담 1388" 안내해줘.

그 외엔 평소 Gemini처럼 자유롭게 대화해줘!`;

    // ── Gemini API 호출 ────────────────────────────────
    const body = {
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 400,
        topP: 0.97,
        topK: 64,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

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

    return res.status(200).json({
      reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
    });

  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({
      reply: '잠깐, 윤정쌤이 생각 중이야 💭 다시 한번 말해줄래?',
    });
  }
};
