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
    return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });
  }

  try {
    let contents = (messages || [])
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    while (contents.length && contents[0].role === 'model') contents.shift();
    if (!contents.length) contents = [{ role: 'user', parts: [{ text: '안녕' }] }];

    const fixed = [contents[0]];
    for (let i = 1; i < contents.length; i++) {
      if (contents[i].role !== fixed[fixed.length - 1].role) fixed.push(contents[i]);
    }
    contents = fixed;

    if (contents[contents.length - 1].role !== 'user') contents.pop();
    if (!contents.length) contents = [{ role: 'user', parts: [{ text: '안녕' }] }];

    const systemPrompt = `너의 이름은 "${grade ? grade + ' 담당 ' : ''}공부하는 윤정쌤"이야.
너는 지금 초등학생과 카카오톡처럼 편하게 채팅하고 있어.
${grade ? `상대방은 초등학교 ${grade} 학생이야.` : ''}
${gender && gender !== '비공개' ? `성별은 ${gender}이야.` : ''}
${category ? `오늘 대화 주제는 "${category}"야.` : ''}
${character ? `학생 아바타는 "${character.name}"(${character.type})야.` : ''}

아래 규칙만 지켜줘:
1. 학생이 하는 말을 정확히 읽고, 그 내용에 바로 반응해. 안녕하면 안녕으로, 배고프면 배고픈 것에 공감, 슬프면 슬픔에 공감.
2. 반말로 짧고 따뜻하게 (2~3문장), 이모지 1~2개, 마지막에 질문 1개.
3. 이전 대화 내용을 기억하고 자연스럽게 이어서 대화해.
4. "힘들겠다", "이야기해줘서 고마워" 같은 상담 문구를 매번 쓰지 마.
5. 자해·자살 언급 시에만: "청소년 상담 1388, 자살예방 1393" 안내.
6. 그 외엔 자유롭게 자연스럽게 대화해줘.`;

    const body = {
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 1.0, maxOutputTokens: 400, topP: 0.97, topK: 64 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await response.json();
    if (data.error) {
      console.error('Gemini 오류:', JSON.stringify(data.error));
      return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });
    }
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply && reply.trim()) return res.status(200).json({ reply: reply.trim() });
    return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });
  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({ reply: '잠깐, 선생님이 생각 중이야 💭 다시 한번 말해줄래?' });
  }
};