import { Appointment } from "@/services/appointment.service";
import { ConsultantProfile } from "@/services/consultant.service";
import { User } from "@/services/user.service";
import { ApiResponse, CreateQuestionDto, Question } from "@/types/api.d";
import { io, Socket } from "socket.io-client";
import { apiClient } from "./api";

export interface ChatRoom {
  id: string;
  appointmentId: string;
  userId: string;
  consultantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  appointmentId?: string;
  questionId?: string;
  senderId?: string; // Keep for backward compatibility with WebSocket
  senderName?: string; // Keep for backward compatibility
  sender?: {
    id: string;
    fullName: string;
    role: string;
    profilePicture?: string;
  };
  content: string;
  type: string;
  createdAt: string;
  isRead?: boolean;
  fileUrl?: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

let socket: Socket | null = null;
let typingTimeout: NodeJS.Timeout;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export function initializeSocket(): Socket {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : undefined;

  if (!token) {
    throw new Error("No authentication token found");
  }

  // Sử dụng URL từ environment hoặc fallback đến domain chính với path /chat
  const SOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

  console.log("[ChatService] Initializing socket with URL:", SOCKET_URL);
  console.log("[ChatService] Token present:", !!token);

  const newSocket = io(SOCKET_URL, {
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ["websocket", "polling"],
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  newSocket.on("connect", () => {
    console.log("[ChatService] Connected to chat server");
    console.log("[ChatService] Socket ID:", newSocket.id);
    console.log("[ChatService] Transport:", newSocket.io.engine.transport.name);
    reconnectAttempts = 0;
  });

  newSocket.on("connected", (data) => {
    console.log("[ChatService] Server confirmed connection:", data);
  });

  newSocket.on("disconnect", (reason) => {
    console.log("[ChatService] Disconnected:", reason);
    if (
      reason !== "io client disconnect" &&
      reconnectAttempts < maxReconnectAttempts
    ) {
      console.log("[ChatService] Attempting to reconnect...");
      const backoffTime = Math.min(2000 * Math.pow(2, reconnectAttempts), 8000);
      reconnectAttempts++;

      setTimeout(() => {
        newSocket.connect();
      }, backoffTime);
    }
  });

  newSocket.on("connect_error", (error) => {
    console.error("[ChatService] Connection failed:", error);
    console.error("[ChatService] Error details:", {
      message: error.message,
      description: (error as any).description,
      context: (error as any).context,
      type: (error as any).type,
    });
    console.error("[ChatService] Error context:", {
      url: SOCKET_URL,
      path: "/chat",
      token: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 10) + "...",
    });

    // Xử lý lỗi xác thực đặc biệt
    if (
      error.message?.includes("Authentication") ||
      error.message?.includes("Unauthorized")
    ) {
      console.error(
        "[ChatService] Authentication error - clearing token and reloading"
      );
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        window.location.href = "/auth/login";
      }
      return;
    }

    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 5000);
    reconnectAttempts++;

    if (reconnectAttempts < maxReconnectAttempts) {
      console.log(
        `[ChatService] Retrying connection in ${backoffTime}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`
      );
      setTimeout(() => {
        newSocket.connect();
      }, backoffTime);
    } else {
      console.error("[ChatService] Max reconnection attempts reached");
    }
  });

  // Thêm event listeners để debug
  newSocket.on("reconnect", (attemptNumber) => {
    console.log("[ChatService] Reconnected after", attemptNumber, "attempts");
  });

  newSocket.on("reconnect_error", (error) => {
    console.error("[ChatService] Reconnection error:", error);
  });

  newSocket.on("reconnect_failed", () => {
    console.error("[ChatService] Reconnection failed");
  });

  console.log("[ChatService] Attempting to connect...");
  newSocket.connect();
  return newSocket;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = initializeSocket();
  }
  return socket;
}

export function resetSocket(): void {
  if (socket) {
    console.log("[ChatService] Resetting socket connection");
    socket.disconnect();
    socket = null;
  }
}

export function refreshSocketAuth(): void {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  if (socket && token) {
    console.log("[ChatService] Refreshing socket authentication");
    socket.auth = {
      token: token,
      userId: userId,
    };
    socket.disconnect();
    socket.connect();
  }
}

export const ChatService = {
  // WebSocket Methods for Question-based Chat
  async joinQuestionRoom(questionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = getSocket();

      if (!socket.connected) {
        console.log(
          "[ChatService] Socket not connected, attempting to connect first..."
        );
        socket.connect();

        // Wait for connection before joining room
        socket.once("connect", () => {
          console.log("[ChatService] Socket connected, now joining room...");
          socket.emit("join_question", { questionId }, (ack: any) => {
            if (ack && ack.status === "success") {
              console.log(
                "[ChatService] Successfully joined question room:",
                questionId
              );
              resolve();
            } else {
              console.error(
                "[ChatService] Failed to join question room:",
                ack?.message || "Unknown error"
              );
              reject(new Error(ack?.message || "Failed to join question room"));
            }
          });
        });

        // Handle connection errors
        socket.once("connect_error", (error) => {
          console.error(
            "[ChatService] Connection error while joining room:",
            error
          );
          reject(new Error("Cannot connect to chat server"));
        });

        return;
      }

      // Socket is already connected
      socket.emit("join_question", { questionId }, (ack: any) => {
        console.log("[ChatService] Join room acknowledgment:", ack);
        if (ack && ack.status === "success") {
          console.log(
            "[ChatService] Successfully joined question room:",
            questionId
          );
          resolve();
        } else {
          console.error(
            "[ChatService] Failed to join question room:",
            ack?.message || "Unknown error"
          );
          reject(new Error(ack?.message || "Failed to join question room"));
        }
      });
    });
  },

  async leaveQuestionRoom(questionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit("leave_question", { questionId }, (ack: any) => {
        if (ack.status === "success") {
          console.log(
            "[ChatService] Successfully left question room:",
            questionId
          );
          resolve();
        } else {
          console.error(
            "[ChatService] Failed to leave question room:",
            ack.message
          );
          reject(new Error(ack.message || "Failed to leave question room"));
        }
      });
    });
  },

  async sendMessageViaWebSocket(
    questionId: string,
    content: string,
    type: string = "text"
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit("send_message", { questionId, content, type }, (ack: any) => {
        if (ack.status === "success") {
          console.log("[ChatService] Message sent successfully via WebSocket");
          resolve();
        } else {
          console.error(
            "[ChatService] Failed to send message via WebSocket:",
            ack.message
          );
          reject(new Error(ack.message || "Failed to send message"));
        }
      });
    });
  },

  async setTypingStatus(questionId: string, isTyping: boolean): Promise<void> {
    try {
      const socket = getSocket();
      socket.emit("typing", { questionId, isTyping });
    } catch (error) {
      console.error("[ChatService] Could not set typing status:", error);
    }
  },

  handleTyping(questionId: string): void {
    this.setTypingStatus(questionId, true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      this.setTypingStatus(questionId, false);
    }, 3000);
  },

  async markMessageAsReadViaWebSocket(
    questionId: string,
    messageId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit("mark_as_read", { questionId, messageId }, (ack: any) => {
        if (ack.status === "success") {
          console.log("[ChatService] Message marked as read via WebSocket");
          resolve();
        } else {
          console.error(
            "[ChatService] Failed to mark message as read:",
            ack.message
          );
          reject(new Error(ack.message || "Failed to mark message as read"));
        }
      });
    });
  },

  // Legacy Appointment-based chat methods (kept for backward compatibility)
  async getAppointmentChatDetails(
    appointmentId: string
  ): Promise<Appointment & { user: User; consultant: ConsultantProfile }> {
    const res = await apiClient.get<
      Appointment & { user: User; consultant: ConsultantProfile }
    >(`/appointments/${appointmentId}/chat-details`);
    return res;
  },

  async joinRoom(appointmentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      getSocket().emit(
        "join_appointment_chat",
        { appointmentId },
        (ack: any) => {
          if (ack.status === "success") resolve();
          else reject(ack);
        }
      );
    });
  },

  async leaveRoom(appointmentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      getSocket().emit(
        "leave_appointment_chat",
        { appointmentId },
        (ack: any) => {
          if (ack.status === "success") resolve();
          else reject(ack);
        }
      );
    });
  },

  async setTyping(appointmentId: string, isTyping: boolean) {
    try {
      getSocket().emit("typing", { appointmentId, isTyping });
    } catch (error) {
      console.error("Could not set typing status:", error);
    }
  },

  // Appointment-based chat methods (restored/renamed for clarity)
  async getAppointmentMessages(
    appointmentId: string,
    params: Record<string, any> = {}
  ) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<PaginatedResponse<ChatMessage>>(
      `/appointments/${appointmentId}/messages?${query}`
    );
  },

  async getAppointmentMessagesWithUrls(
    appointmentId: string,
    params: Record<string, any> = {}
  ) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<PaginatedResponse<ChatMessage>>(
      `/appointments/${appointmentId}/messages/with-urls?${query}`
    );
  },

  async sendAppointmentMessage(
    appointmentId: string,
    data: { content: string; type?: string }
  ) {
    const payload = {
      content: data.content,
      type: data.type || "text",
      appointmentId: appointmentId,
    };
    return apiClient.post<ChatMessage>(
      `/appointments/${appointmentId}/messages`,
      payload
    );
  },

  async sendAppointmentFile(appointmentId: string, formData: FormData) {
    return apiClient.post<ChatMessage>(
      `/appointments/${appointmentId}/messages/file`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  async sendAppointmentPublicPdf(appointmentId: string, formData: FormData) {
    return apiClient.post<ChatMessage>(
      `/appointments/${appointmentId}/messages/public-pdf`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  // Question-based chat methods (REST API)
  async getQuestionMessages(
    questionId: string,
    params: Record<string, any> = {}
  ) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<PaginatedResponse<ChatMessage>>(
      `/chat/questions/${questionId}/messages?${query}`
    );
  },

  async getQuestionMessagesWithUrls(
    questionId: string,
    params: Record<string, any> = {}
  ) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<PaginatedResponse<ChatMessage>>(
      `/chat/questions/${questionId}/messages/with-urls?${query}`
    );
  },

  async sendQuestionMessage(
    questionId: string,
    data: { content: string; type?: string }
  ) {
    const payload = {
      content: data.content,
      type: data.type || "text",
      questionId: questionId,
    };
    return apiClient.post<ChatMessage>(
      `/chat/questions/${questionId}/messages`,
      payload
    );
  },

  async sendQuestionFile(questionId: string, formData: FormData) {
    return apiClient.post<ChatMessage>(
      `/chat/questions/${questionId}/messages/file`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  async sendQuestionPublicPdf(questionId: string, formData: FormData) {
    return apiClient.post<ChatMessage>(
      `/chat/questions/${questionId}/messages/public-pdf`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  async downloadFile(messageId: string) {
    return apiClient.get<{ fileUrl: string }>(
      `/chat/messages/${messageId}/file`
    );
  },

  async markAllAppointmentMessagesAsRead(appointmentId: string) {
    return apiClient.patch(`/appointments/${appointmentId}/messages/read-all`);
  },

  async markAllQuestionMessagesAsRead(questionId: string) {
    return apiClient.patch(`/chat/questions/${questionId}/messages/read-all`);
  },

  async deleteMessage(messageId: string) {
    return apiClient.delete(`/chat/messages/${messageId}`);
  },

  async getUnreadCount() {
    return apiClient.get<{ unreadCount: number }>(
      `/chat/messages/unread-count`
    );
  },

  async markMessageAsRead(messageId: string) {
    return apiClient.patch(`/chat/messages/${messageId}/read`);
  },

  async createQuestion(
    data: CreateQuestionDto
  ): Promise<ApiResponse<Question>> {
    return apiClient.post<ApiResponse<Question>>("/chat/questions", data);
  },

  async getQuestions(
    params: { search?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Question>> {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get<PaginatedResponse<Question>>(
      `/chat/questions${query ? `?${query}` : ""}`
    );
  },

  async getQuestionById(questionId: string): Promise<Question> {
    try {
      console.log(
        `[ChatService] Attempting to fetch question with ID: ${questionId}`
      );
      const res = await apiClient.get<Question>(
        `/chat/questions/${questionId}`
      );
      console.log(
        `[ChatService] Successfully fetched question ${questionId}:`,
        res
      );
      return res;
    } catch (error: any) {
      console.error(
        `[ChatService] Error fetching question ${questionId}:`,
        error
      );
      if (error.response) {
        console.error(
          "[ChatService] API Error Response Data:",
          error.response.data
        );
        console.error(
          "[ChatService] API Error Response Status:",
          error.response.status
        );
      }
      throw error;
    }
  },

  async getChatRoomByAppointmentId(appointmentId: string): Promise<ChatRoom> {
    const res = await apiClient.get<ChatRoom>(
      `/appointments/${appointmentId}/chat-room`
    );
    return res;
  },

  // WebSocket Event Listeners
  onNewMessage(callback: (message: ChatMessage) => void) {
    const socket = getSocket();
    const handler = (data: { data: ChatMessage } | ChatMessage) => {
      const message = "data" in data ? data.data : data;
      callback(message);
    };
    socket.on("new_message", handler);
    return () => socket.off("new_message", handler);
  },

  onTypingStatus(
    callback: (data: {
      userId: string;
      userName: string;
      isTyping: boolean;
      appointmentId?: string;
      questionId?: string;
    }) => void
  ) {
    const socket = getSocket();
    const handler = (data: {
      userId: string;
      userName: string;
      isTyping: boolean;
      appointmentId?: string;
      questionId?: string;
    }) => {
      callback(data);
    };
    socket.on("typing_status", handler);
    return () => socket.off("typing_status", handler);
  },

  onMessageRead(
    callback: (data: {
      messageId: string;
      userId: string;
      appointmentId?: string;
      questionId?: string;
    }) => void
  ) {
    const socket = getSocket();
    const handler = (data: {
      messageId: string;
      userId: string;
      appointmentId?: string;
      questionId?: string;
    }) => {
      callback(data);
    };
    socket.on("message_read", handler);
    return () => socket.off("message_read", handler);
  },

  onUserJoined(
    callback: (data: {
      userId: string;
      userName: string;
      questionId: string;
    }) => void
  ) {
    const socket = getSocket();
    const handler = (data: {
      userId: string;
      userName: string;
      questionId: string;
    }) => {
      callback(data);
    };
    socket.on("user_joined", handler);
    return () => socket.off("user_joined", handler);
  },

  onUserLeft(
    callback: (data: {
      userId: string;
      userName: string;
      questionId: string;
    }) => void
  ) {
    const socket = getSocket();
    const handler = (data: {
      userId: string;
      userName: string;
      questionId: string;
    }) => {
      callback(data);
    };
    socket.on("user_left", handler);
    return () => socket.off("user_left", handler);
  },

  // Utility methods
  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  isConnected(): boolean {
    return socket?.connected || false;
  },
};
