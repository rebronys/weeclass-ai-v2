const fetch = require('node-fetch');

// =============================================
// 50가지 맥락별 폴백 메시지
// =============================================
const FALLBACK_BY_CONTEXT = {
  high_risk: [
    '지금 많이 힘들구나. 선생님한테 바로 이야기해줘. 전화 117로 연락해도 돼 💙',
    '네 마음이 많이 무겁겠다. 혼자 있지 말고 가까운 어른한테 꼭 이야기해줘.',
    '지금 이 순간 네 곁에 있어줄 사람이 필요해. 117이나 1393으로 전화해봐.',
  ],
  low_grade_positive: [
    '와, 정말 잘했네! 그때 기분이 어땠어? 😊',
    '오호, 그런 일이 있었구나! 더 이야기해줄 수 있어?',
    '맞아, 그럴 수 있어! 그래서 지금은 어때?',
    '좋은 일이 있었나봐~ 선생님도 기분 좋아지는데? 🌸',
    '그랬구나! 친구들이랑은 요즘 어때?',
  ],
  low_grade_negative: [
    '그랬구나, 많이 속상했겠다 😢 선생님한테 더 이야기해줄 수 있어?',
    '그때 어떤 마음이었어? 선생님이 잘 들을게.',
    '힘들었겠다. 그 일이 언제부터 있었어?',
    '많이 무거웠겠네. 그 상황에서 누가 도와줬어?',
    '그런 일이 있었구나. 지금은 조금 괜찮아?',
  ],
  mid_grade_positive: [
    '오, 그런 생각을 했구나! 어떻게 그런 결정을 했어?',
    '잘 해결했네~ 그 과정에서 뭐가 제일 힘들었어?',
    '좋은 경험이었겠다! 앞으로도 그렇게 할 수 있을 것 같아?',
    '그렇구나, 그 상황에서 정말 잘 대처했어 👍',
    '와, 대단한데! 그때 어떤 기분이었어?',
  ],
  mid_grade_negative: [
    '그 상황이 많이 힘들었겠다. 지금 기분은 어때?',
    '그런 일이 있었군. 주변에 이야기할 수 있는 친구가 있어?',
    '많이 지쳤겠다. 요즘 잠은 잘 자고 있어?',
    '그 감정이 언제부터 시작됐어? 천천히 이야기해봐.',
    '혼자 감당하기 힘들었겠다. 부모님은 알고 계셔?',
  ],
  high_grade_positive: [
    '그 상황을 잘 분석했네. 지금 어떻게 풀어가고 있어?',
    '스스로 잘 해결하고 있구나. 어떤 방법이 제일 효과적이었어?',
    '좋은 방향으로 가고 있는 것 같아. 앞으로의 계획은 있어?',
    '그런 경험이 나중에 큰 도움이 될 거야 💪',
    '잘 견뎌왔네. 그 과정에서 뭘 배웠어?',
  ],
  high_grade_negative: [
    '많이 복잡한 마음이겠다. 지금 가장 힘든 게 뭐야?',
    '그 감정을 혼자 안고 있었구나. 얼마나 됐어?',
    '지금 상황이 쉽지 않겠다. 어떤 도움이 필요해?',
    '그 문제가 학교생활에도 영향을 주고 있어?',
    '많이 지쳐 보여. 요즘 밥은 잘 먹고 있어?',
  ],
  friend_issue: [
    '친구 관계가 힘들면 정말 지치지. 어떤 일이 있었어?',
    '그 친구와는 언제부터 사이가 안 좋아진 거야?',
    '그 상황에서 네가 어떻게 했는지 이야기해줄 수 있어?',
    '친구한테 직접 이야기해본 적 있어?',
    '그 일이 있고 나서 학교 가기 싫었겠다.',
  ],
  family_issue: [
    '가족 문제는 정말 마음이 복잡하지. 어떤 일이 있었어?',
    '집에서 있었던 일이구나. 그때 네 기분이 어땠어?',
    '부모님이랑 대화가 잘 안 되는 편이야?',
    '그 상황에서 네가 할 수 있는 게 없어서 더 힘들었겠다.',
    '가족 중에 네 이야기를 들어줄 수 있는 사람이 있어?',
  ],
  study_issue: [
    '공부 때문에 스트레스가 많겠다. 어떤 과목이 제일 힘들어?',
    '성적 때문에 힘들구나. 부모님 기대가 커?',
    '공부가 안 될 때 어떻게 해? 어떤 방법을 써봤어?',
    '지금 제일 집중이 안 되는 이유가 뭔 것 같아?',
    '공부 외에 요즘 즐거운 게 있어?',
  ],
  default: [
    '그랬구나. 조금 더 이야기해줄 수 있어?',
    '잘 듣고 있어. 계속 이야기해줘 💙',
    '그 상황에서 어떤 마음이 들었어?',
    '용기 내어 말해줘서 고마워요 😊',
    '그게 언제부터였어? 더 자세히 들을게.',
    '그 일이 있고 나서 어떻게 됐어?',
    '지금 기분이 어때? 말로 표현해줄 수 있어?',
  ],
};

function getFallbackMessage(grade, category, userText) {
  const gradeNum = parseInt(grade) || 3;
  const isNegative = /힘들|싫|무서|슬프|화|짜증|외롭|모르겠|포기|죽|자해|아프|울|걱정|불안|무기력|지쳐/.test(userText);
  const isHighRisk = /죽고싶|자살|자해|사라지고싶|끊고싶/.test(userText);

  if (isHighRisk) {
    const arr = FALLBACK_BY_CONTEXT.high_risk;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  if (category === '친구관계' || category === '따돌림·괴롭힘') {
    const arr = FALLBACK_BY_CONTEXT.friend_issue;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  if (category === '가족문제') {
    const arr = FALLBACK_BY_CONTEXT.family_issue;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  if (category === '학습·성적') {
    const arr = FALLBACK_BY_CONTEXT.study_issue;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  if (gradeNum <= 2) {
    const arr = isNegative ? FALLBACK_BY_CONTEXT.low_grade_negative : FALLBACK_BY_CONTEXT.low_grade_positive;
    return arr[Math.floor(Math.random() * arr.length)];
  } else if (gradeNum <= 4) {
    const arr = isNegative ? FALLBACK_BY_CONTEXT.mid_grade_negative : FALLBACK_BY_CONTEXT.mid_grade_positive;
    return arr[Math.floor(Math.random() * arr.length)];
  } else {
    const arr = isNegative ? FALLBACK_BY_CONTEXT.high_grade_negative : FALLBACK_BY_CONTEXT.high_grade_positive;
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// =============================================
// 한국 상담 기법 기반 시스템 프롬프트 강화
// =============================================
function buildEnhancedSystemPrompt(messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const basePrompt = systemMsg ? systemMsg.content : '';

  const counselingTechniques = `
[한국 상담 기법 적용 원칙]
1. **반영(Reflection)**: 학생이 말한 감정과 내용을 그대로 반영해주세요.
   예) "많이 외로웠겠구나", "그 상황이 정말 힘들었겠어"
2. **공감(Empathy)**: 판단하지 않고 학생의 입장에서 느끼는 것을 표현하세요.
3. **명료화(Clarification)**: 모호한 부분은 구체적으로 물어보세요.
   예) "그게 언제부터였어?", "어떤 상황에서 그런 기분이 들어?"
4. **개방형 질문**: 예/아니오로 답할 수 없는 질문을 사용하세요.
5. **강점 발견**: 학생의 긍정적인 면을 찾아 격려하세요.
6. **단계적 탐색**: 감정 → 상황 → 원인 → 해결책 순서로 탐색하세요.
7. **한국 초등학생 특성 반영**: 
   - 저학년(1-2학년): 쉬운 단어, 짧은 문장, 감정 그림책 언어
   - 중학년(3-4학년): 친근한 언어, 구체적 상황 질문
   - 고학년(5-6학년): 조금 더 논리적, 스스로 해결책 탐색 유도
8. **위기 개입**: 자해/자살 언급 시 즉시 전문기관 연계 안내
`;

  return basePrompt + '\n\n' + counselingTechniques;
}

// =============================================
// Gemini API 호출
// =============================================
async function callGemini(messages, apiKey) {
  const enhancedSystemPrompt = buildEnhancedSystemPrompt(messages);

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body = {
    contents,
    system_instruction: {
      parts: [{ text: enhancedSystemPrompt }],
    },
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 400,
      topP: 0.9,
      topK: 40,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
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
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// =============================================
// 메인 핸들러
// =============================================
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, grade, category } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const userText = messages?.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

  if (!apiKey) {
    const fallback = getFallbackMessage(grade || '3학년', category || '', userText);
    return res.status(200).json({ reply: fallback });
  }

  try {
    const reply = await callGemini(messages, apiKey);

    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    } else {
      const fallback = getFallbackMessage(grade || '3학년', category || '', userText);
      return res.status(200).json({ reply: fallback });
    }
  } catch (err) {
    console.error('Gemini API 오류:', err);
    const fallback = getFallbackMessage(grade || '3학년', category || '', userText);
    return res.status(200).json({ reply: fallback });
  }
};
