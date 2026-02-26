const fetch = require('node-fetch');

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
      return res.status(200).json({ reply: '안녕! 무슨 이야기 하고 싶어? 😊' });
    }
    
    // 1. 시스템 지시사항 분리
    const systemInstruction = {
      role: "user",
      parts: [{
        text: `너는 초등학생과 카카오톡처럼 자연스럽게 대화하는 친근한 선생님 "공부하는 윤정쌤"이야.
${grade ? `학생은 ${grade}이야.` : ''}${gender && gender !== '비공개' ? ` 성별은 ${gender}.` : ''}${category ? ` 오늘 주제는 "${category}".` : ''}${character ? ` 학생 아바타는 "${character.name}".` : ''}

규칙:
- 학생 말에 자연스럽게 반응해줘. (예: 안녕→안녕, 배고파→배고픔 공감, 이름 질문→이름 알려주기)
- 항상 반말로 대화하고, 가급적 2문장 이내로 짧게 답변해줘.
- 답변 끝에 귀여운 이모지 1개를 붙여줘.
- 대화가 끊기지 않도록 마지막에 질문을 1개씩 던져줘.
- 절대 했던 말을 똑같이 반복하지 마.
`
      }]
    };
    
    // 2. 대화 히스토리를 Gemini 형식으로 변환
    // 클라이언트에서 'assistant' 역할로 보냈다고 가정
    const conversationHistory = (messages || [])
      .filter(m => m.role !== 'system') // system 역할은 위에서 처리했으므로 제외
      .slice(-8) // 최근 8개 대화만 사용
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model', // 'assistant' 등 다른 역할을 'model'로 변환
        parts: [{ text: m.content }]
      }));

    const body = {
      // 3. 시스템 지시사항 + 대화 히스토리를 합쳐서 전달
      contents: [systemInstruction, ...conversationHistory],
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

    const response = await fetch(
      // 참고: 2.0-pro가 더 성능이 좋을 수 있습니다. gemini-1.0-pro-001 도 좋은 선택입니다.
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      }
    );

    const data = await response.json();

    if (data.error || !data.candidates || data.candidates.length === 0) {
      console.error('Gemini 오류 또는 빈 응답:', JSON.stringify(data, null, 2));
      return res.status(200).json({ reply: '다시 말해줄래? 💙' });
    }

    const reply = data.candidates[0]?.content?.parts?.[0]?.text;

    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    }

    console.error('내용이 없는 응답:', JSON.stringify(data).slice(0, 200));
    return res.status(200).json({ reply: '다시 말해줄래? 💙' });

  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({ reply: '잠깐, 다시 말해줄래? 💙' });
  }
};
