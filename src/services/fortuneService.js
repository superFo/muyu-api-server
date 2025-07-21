import axios from 'axios';

const BAILIAN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const API_KEY = 'sk-00da9fb7ba0a4fc1bbc5feab85e171f7';

// 调用大模型获取今日运势
export async function todayFortune(user) {
  try {
    const prompt = `请为用户生成今日运势，内容包括：综合分数、爱情分数、财富分数、事业分数、学习分数、幸运色、幸运数字、幸运食物、建议、避免事项、星象信息。要求内容简洁、积极、娱乐化，返回结构化JSON。`;
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
    throw new Error('获取今日运势失败，请稍后重试');
  }
}

// 调用大模型进行AI占卜
export async function askFortune(user, question) {
  try {
    const prompt = `你是一个娱乐化的AI占卜师，请用简洁、积极的语气回答用户的问题，内容仅供娱乐。用户提问：${question}`;
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
    // 假设大模型返回 { output: { text: '...' } }
    const text = response.data?.output?.text || '';
    return { answer: text };
  } catch (err) {
    throw new Error('AI占卜失败，请稍后重试');
  }
} 