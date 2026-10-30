/**
 * Client helper to communicate with the online-only Cloud AI backend (/api/chat).
 * Protects against duplicate requests, handles network/HTTP errors safely,
 * and formats history for the serverless function.
 */

export interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  text: string;
}

export interface AiChatResult {
  success: boolean;
  reply?: string;
  error?: string;
  model?: string;
}

export async function askCloudAi(
  message: string,
  history: ChatHistoryItem[] = []
): Promise<AiChatResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  // Check offline status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Device is offline. An active internet connection is required for Cloud AI.'
    };
  }

  try {
    const payload = {
      message: trimmed,
      history: history.slice(-6).map((h) => ({
        sender: h.sender,
        text: h.text
      }))
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // If response body is not JSON
    }

    if (!res.ok) {
      const serverErrMsg = data?.error || `Server responded with status ${res.status}`;
      return {
        success: false,
        error: serverErrMsg
      };
    }

    if (data && data.reply) {
      return {
        success: true,
        reply: data.reply,
        model: data.model
      };
    }

    return {
      success: false,
      error: data?.error || 'Received an empty reply from Cloud AI.'
    };
  } catch (err: any) {
    // Distinguish abort vs network failure
    if (err?.name === 'AbortError') {
      return { success: false, error: 'Request was cancelled.' };
    }
    return {
      success: false,
      error: 'Failed to connect to Cloud AI service. Check your internet connection or deployment status.'
    };
  }
}
