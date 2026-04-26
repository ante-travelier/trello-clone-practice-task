import api from './axios.js';

export async function getComments(cardId) {
  const res = await api.get(`/cards/${cardId}/comments`);
  return res.data.data;
}

export async function createComment(cardId, data) {
  const res = await api.post(`/cards/${cardId}/comments`, data);
  return res.data.data;
}
