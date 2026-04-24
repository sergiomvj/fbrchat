export async function transcribeAudio({ mediaUrl }) {
  return {
    transcription: `Transcricao local do audio ${mediaUrl.split("/").pop() || "recebido"}.`
  };
}
