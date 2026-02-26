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

    // 전체 대화를 하나의 텍스트로 합쳐서 단일 user 메시지로 전송
    const allMsgs = (messages || []).filter(m => m.role !== 'system');
    
    // 대화 히스토리 텍스트로 변환
    const historyText = allMsgs.slice(-8).map(m => {
      const who = m.role === 'user' ? '학생' : '선생님';
      return `${who}: ${m.content}`;
    }).join('\n');

    const systemPrompt = `너는 초등학생과 카카오톡처럼 자연스럽게 대화하는 친근한 선생님 "공부하는 윤정쌤"이야.
${grade ? `학생은 ${grade}이야.` : ''}${gender && gender !== '비공개' ? ` 성별은 ${gender}.` : ''}${category ? ` 오늘 주제는 "${category}".` : ''}${character ? ` 학생 아바타는 "${character.name}".` : ''}

아래는 지금까지의 대화야:
${historyText}

위 대화를 읽고 학생의 마지막 말에 자연스럽게 반응해줘.
규칙:
- 학생 말 그대로 반응 (안녕→안녕인사, 배고파→배고픔공감, 이름물어보면→이름알려줘)
- 반말, 짧게 2문장, 이모지 1개, 마지막에 질문 1개
- 절대 같은 말 반복 금지
선생님의 다음 답변:`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini 오류:', data.error.code, data.error.message);
      return res.status(200).json({ reply: '다시 말해줄래? 💙' });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    }

    console.error('빈 응답:', JSON.stringify(data).slice(0, 200));
    return res.status(200).json({ reply: '다시 말해줄래? 💙' });

  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({ reply: '잠깐, 다시 말해줄래? 💙' });
  }
};
