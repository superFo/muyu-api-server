import axios from 'axios';

const BAILIAN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const API_KEY = 'sk-00da9fb7ba0a4fc1bbc5feab85e171f7';

// 调用大模型获取今日运势
export async function todayFortune(user) {
  try {
    const prompt = `请为用户生成今日运势，内容包括：综合分数、爱情分数、财富分数、事业分数、学习分数、幸运色、幸运数字、幸运食物、建议、避免事项（如无可写“无特别需要避免事项”）、星象信息（如无可写“今日星象平稳”）。要求内容简洁、积极、娱乐化，返回结构化JSON。`;
    console.log('[fortuneService.todayFortune] user:', user, 'prompt:', prompt);
    const response = await axios.post(
      BAILIAN_API_URL,
      {
        model: 'qwen-turbo',
        input: { prompt },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log('[fortuneService.todayFortune] aliyun response:', response.data);
    // 假设大模型返回 { output: { text: '{...json...}' } }
    const text = response.data?.output?.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return data;
  } catch (err) {
    console.error('[fortuneService.todayFortune] error:', err);
    throw new Error('获取今日运势失败，请稍后重试');
  }
}

// 调用大模型进行占卜
export async function askFortune(user, question) {
  try {
    const prompt = `你是一个娱乐化的占卜师，请用简洁、积极的语气回答用户的问题，内容仅供娱乐。禁止输出任何色情、政治、暴力、违法、敏感、攻击性、歧视性等相关内容，如遇此类问题请委婉拒绝并提示用户更换提问。\n【重要】你的回复内容中不得出现“AI”“人工智能”“机器人”等字样，也不能自称AI或机器人，只能以“占卜师”自称。用户提问：${question}`;
    console.log('[fortuneService.askFortune] user:', user, 'prompt:', prompt);
    const response = await axios.post(
      BAILIAN_API_URL,
      {
        model: 'qwen-turbo',
        input: { prompt },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log('[fortuneService.askFortune] aliyun response:', response.data);
    // 假设大模型返回 { output: { text: '...' } }
    const text = response.data?.output?.text || '';
    return { answer: text };
  } catch (err) {
    // 增强日志
    console.error('[fortuneService.askFortune] error:', err);
    if (err && err.response) {
      console.error('[fortuneService.askFortune] err.response:', err.response);
      console.error('[fortuneService.askFortune] err.response.data:', err.response.data);
    }
    console.error('[fortuneService.askFortune] err.toString():', err.toString());
    throw new Error(err?.response?.data?.message || err.message || 'AI占卜失败，请稍后重试');
  }
} 