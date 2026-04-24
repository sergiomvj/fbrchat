export async function synthesizeSpeech({ messageId }) {
  return {
    audioUrl: `/mock-tts/${messageId}.mp3`
  };
}
