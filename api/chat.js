const fetch = require('node-fetch');

const FALLBACKS = [
  '응! 좀 더 이야기해줄 수 있어? 😊',
  '그랬구나 💙 어떤 기분이었어?',
  '잘 듣고 있어! 계속 말해줘 😌',
  '천천히 말해줘도 괜찮아 💙',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages, grade, category, character, gender } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('API 키 없음');
      return res.status(200).json({ reply: FALLBACKS[0] });
    }

    // 마지막 사용자 메시지만 추출
    const allMsgs = (messages || []).filter(m => m.role !== 'system');
    const lastUserMsg = allMsgs.filter(m => m.role === 'user').pop();
    
    if (!lastUserMsg) {
      return res.status(200).json({ reply: '안녕! 무슨 이야기 하고 싶어? 😊' });
    }

    // 대화 히스토리 최대 10개로 제한, user/model 교대로 정리
    const recentMsgs = allMsgs.slice(-10);
    const contents = [];
    
    for (const msg of recentMsgs) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      // 연속 같은 role 방지
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n' + msg.content;
      } else {
        contents.push({ role, parts: [{ text: msg.content }] });
      }
    }

    // 반드시 user로 시작, user로 끝나야 함
    while (contents.length > 0 && contents[0].role === 'model') contents.shift();
    while (contents.length > 0 && contents[contents.length - 1].role === 'model') contents.pop();
    
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: lastUserMsg.content }] });
    }

    const systemPrompt = `너는 초등학생과 카카오톡처럼 자연스럽게 대화하는 친근한 선생님 "공부하는 윤정쌤"이야.
${grade ? `학생은 ${grade}이야.` : ''}${gender && gender !== '비공개' ? ` 성별은 ${gender}.` : ''}${category ? ` 오늘 주제는 "${category}".` : ''}${character ? ` 아바타는 "${character.name}".` : ''}

규칙:
- 학생이 한 말에 정확히 반응해. 안녕→안녕, 배고파→배고픔공감, 싸웠어→싸운것공감
- 반말, 짧게(2문장), 이모지 1개, 마지막에 질문 1개
- 절대 매번 같은 말 반복하지 마
- 자연스럽고 따뜻하게`;

    const body = {
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { 
        temperature: 1.0, 
        maxOutputTokens: 200, 
        topP: 0.95, 
        topK: 40 
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    console.log('전송 contents 수:', contents.length);
    console.log('roles:', contents.map(c => c.role).join(' -> '));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini 오류 코드:', data.error.code, '메시지:', data.error.message);
      return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });
    }
    
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    }
    
    console.error('빈 응답. finishReason:', data?.candidates?.[0]?.finishReason);
    return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });

  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({ reply: '잠깐, 다시 말해줄래? 💙' });
  }
};
