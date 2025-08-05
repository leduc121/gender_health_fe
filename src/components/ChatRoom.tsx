"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Appointment,
  AppointmentService,
} from "@/services/appointment.service";
import {
  ChatMessage,
  ChatService,
  initializeSocket,
} from "@/services/chat.service";
import {
  ConsultantProfile,
  ConsultantService,
} from "@/services/consultant.service";
import { User, UserService } from "@/services/user.service";
import { Question } from "@/types/api.d";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertCircle, Download, Loader2, Paperclip, Send } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import WebSocketStatus from "./WebSocketStatus";

interface ChatRoomProps {
  questionId: string;
  initialTitle?: string;
  initialContent?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  questionId,
  initialTitle,
  initialContent,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatQuestion, setChatQuestion] = useState<Question | null>(null);
  const [creatorUser, setCreatorUser] = useState<User | null>(null);
  const [consultantProfile, setConsultantProfile] =
    useState<ConsultantProfile | null>(null);
  const [appointmentDetails, setAppointmentDetails] =
    useState<Appointment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      const socket = initializeSocket();
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[ChatRoom] Connected to chat server");
        setSocketConnected(true);
        setConnectionError(null);

        // Join question room with better error handling
        ChatService.joinQuestionRoom(questionId)
          .then(() => {
            console.log("[ChatRoom] Successfully joined question room");
          })
          .catch((error) => {
            console.error("[ChatRoom] Failed to join question room:", error);
            setConnectionError(
              `Không thể tham gia phòng chat: ${error.message}`
            );
          });
      });

      socket.on("connected", (data) => {
        console.log("[ChatRoom] Server confirmed connection:", data);
      });

      socket.on("joined_question", (data) => {
        console.log("[ChatRoom] Successfully joined question:", data);
      });

      socket.on("user_joined", (data) => {
        console.log("[ChatRoom] User joined:", data);
        toast({
          title: "Thông báo",
          description: `${data.userName} đã tham gia phòng chat`,
        });
      });

      socket.on("user_left", (data) => {
        console.log("[ChatRoom] User left:", data);
        toast({
          title: "Thông báo",
          description: `${data.userName} đã rời phòng chat`,
        });
      });

      socket.on("new_message", (data) => {
        console.log("[ChatRoom] New message received:", data);
        const message = data.data || data;

        setMessages((prevMessages) => {
          // Check if message already exists
          if (prevMessages.some((msg) => msg.id === message.id)) {
            return prevMessages;
          }

          // Replace temporary message if it exists
          if (
            message.senderId === user?.id &&
            prevMessages.some(
              (msg) =>
                msg.content === message.content && msg.id.startsWith("temp-")
            )
          ) {
            return prevMessages.map((msg) =>
              msg.content === message.content && msg.id.startsWith("temp-")
                ? message
                : msg
            );
          }

          return [...prevMessages, message];
        });

        // Mark message as read if not from current user
        if (message.senderId !== user?.id) {
          ChatService.markMessageAsRead(message.id);
        }
      });

      socket.on("typing_status", (data) => {
        console.log("[ChatRoom] Typing status:", data);
        if (data.questionId === questionId && data.userId !== user?.id) {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userName);
            } else {
              newSet.delete(data.userName);
            }
            return newSet;
          });
        }
      });

      socket.on("message_read", (data) => {
        console.log("[ChatRoom] Message read:", data);
        if (data.questionId === questionId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId ? { ...msg, isRead: true } : msg
            )
          );
        }
      });

      socket.on("connect_error", (error) => {
        console.error("[ChatRoom] Connection error:", error);
        setSocketConnected(false);

        // Xử lý lỗi xác thực đặc biệt
        const errorMessage = (error as any)?.message || error.toString();
        if (
          errorMessage.includes("Authentication") ||
          errorMessage.includes("Unauthorized")
        ) {
          setConnectionError(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
          // Redirect to login after a delay
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 3000);
        } else {
          setConnectionError("Không thể kết nối đến máy chủ chat");
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("[ChatRoom] Disconnected:", reason);
        setSocketConnected(false);
        if (reason !== "io client disconnect") {
          setConnectionError("Mất kết nối với máy chủ");
        }
      });

      return socket;
    } catch (error) {
      console.error("[ChatRoom] Error initializing socket:", error);
      setConnectionError("Không thể khởi tạo kết nối chat");
      return null;
    }
  }, [questionId, user?.id, toast]);

  const fetchChatData = useCallback(
    async (retriesRemaining = 3) => {
      setIsLoading(true);
      let currentQuestion: Question | null = null;

      try {
        // Try to fetch Question by questionId first
        currentQuestion = await ChatService.getQuestionById(questionId);
        setChatQuestion(currentQuestion);
        console.log("[ChatRoom] Fetched Question by ID:", currentQuestion);
      } catch (questionError: any) {
        console.error(
          "[ChatRoom] Error fetching question by ID:",
          questionError
        );
        // If fetching Question fails, try to construct a Question from initial props
        if (initialTitle && initialContent && user) {
          currentQuestion = {
            id: questionId,
            title: initialTitle,
            content: initialContent,
            userId: user.id,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setChatQuestion(currentQuestion);
          console.log(
            "[ChatRoom] Constructed Question from initial props:",
            currentQuestion
          );
        }
      } finally {
        if (!currentQuestion) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy phòng chat. Vui lòng thử lại sau.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Fetch creator user details
        if (currentQuestion.userId) {
          try {
            const fetchedCreator = await UserService.getUserById(
              currentQuestion.userId
            );
            setCreatorUser(fetchedCreator);
          } catch (userError) {
            console.error(
              "[ChatRoom] Error fetching creator user details:",
              userError
            );
            setCreatorUser(null);
          }
        }

        // Fetch associated appointment and consultant details
        if (currentQuestion.appointmentId) {
          try {
            const fetchedAppointment =
              await AppointmentService.getAppointmentById(
                currentQuestion.appointmentId
              );
            setAppointmentDetails(fetchedAppointment);
            if (fetchedAppointment?.consultantId) {
              const fetchedConsultant =
                await ConsultantService.getConsultantProfile(
                  fetchedAppointment.consultantId
                );
              setConsultantProfile(fetchedConsultant);
            }
          } catch (appError) {
            console.error(
              "[ChatRoom] Error fetching appointment details for question:",
              appError
            );
            setAppointmentDetails(null);
            setConsultantProfile(null);
          }
        }

        // Load message history
        try {
          const messagesResponse =
            await ChatService.getQuestionMessages(questionId);
          setMessages(messagesResponse.data.reverse());
          await ChatService.markAllQuestionMessagesAsRead(questionId);
        } catch (messagesError) {
          console.error("[ChatRoom] Error loading messages:", messagesError);
          toast({
            title: "Cảnh báo",
            description: "Không thể tải lịch sử tin nhắn",
            variant: "destructive",
          });
        }

        setIsLoading(false);
      }
    },
    [questionId, initialTitle, initialContent, toast, user]
  );

  useEffect(() => {
    if (!questionId) {
      setIsLoading(false);
      return;
    }

    fetchChatData();
    const socket = initializeWebSocket();

    return () => {
      if (socket) {
        // Leave room before disconnecting
        socket.emit(
          "leave_question",
          { questionId },
          (acknowledgement: any) => {
            console.log("[ChatRoom] Leave room response:", acknowledgement);
          }
        );
        socket.disconnect();
      }
    };
  }, [fetchChatData, initializeWebSocket, questionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = useCallback(() => {
    if (!socketRef.current || !socketConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", { questionId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit("typing", { questionId, isTyping: false });
    }, 1000);
  }, [questionId, isTyping, socketConnected]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !questionId || !socketConnected) {
      if (!socketConnected) {
        toast({
          title: "Lỗi",
          description: "Không có kết nối với máy chủ. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSending(true);
    try {
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        questionId: questionId,
        senderId: user?.id || "unknown",
        senderName: user?.fullName || "Bạn",
        content: newMessage,
        type: "text",
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      setNewMessage("");

      // Stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      socketRef.current.emit("typing", { questionId, isTyping: false });

      scrollToBottom();

      // Send via WebSocket first
      socketRef.current.emit(
        "send_message",
        {
          questionId,
          content: tempMessage.content,
          type: "text",
        },
        (acknowledgement: any) => {
          if (acknowledgement.status === "success") {
            console.log("[ChatRoom] Message sent successfully via WebSocket");
          } else {
            console.error(
              "[ChatRoom] Failed to send message via WebSocket:",
              acknowledgement.message
            );
            // Fallback to REST API
            ChatService.sendQuestionMessage(questionId, {
              content: tempMessage.content,
              type: "text",
            }).catch((error) => {
              console.error("[ChatRoom] REST API fallback also failed:", error);
              toast({
                title: "Lỗi",
                description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
                variant: "destructive",
              });
            });
          }
        }
      );
    } catch (error) {
      console.error("[ChatRoom] Error sending message:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !questionId) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Lỗi",
        description: "Tệp quá lớn. Kích thước tối đa là 10MB.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Lỗi",
        description: "Loại tệp không được hỗ trợ.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", file.type.startsWith("image/") ? "image" : "file");

    setIsSending(true);
    try {
      const sentFileMessage = await ChatService.sendQuestionFile(
        questionId,
        formData
      );
      setMessages((prevMessages) => {
        if (prevMessages.some((msg) => msg.id === sentFileMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, sentFileMessage];
      });
      toast({
        title: "Thành công",
        description: "Tệp đã được gửi.",
      });
    } catch (error) {
      console.error("[ChatRoom] Error sending file:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tệp. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadFile = async (messageId: string, filename: string) => {
    try {
      const response = await ChatService.downloadFile(messageId);
      if (response.fileUrl) {
        const link = document.createElement("a");
        link.href = response.fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy URL tệp để tải xuống.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[ChatRoom] Error downloading file:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải xuống tệp. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Không tìm thấy phòng chat.</p>
      </div>
    );
  }

  const getSenderName = (message: ChatMessage) => {
    if (message.senderId === user?.id) {
      return "Bạn";
    }
    if (creatorUser?.id === message.senderId) {
      return `${creatorUser.firstName} ${creatorUser.lastName}` || "Người dùng";
    }
    if (consultantProfile?.user.id === message.senderId) {
      return `${consultantProfile.user.firstName} ${consultantProfile.user.lastName}`;
    }
    return message.senderName || "Người dùng khác";
  };

  const getSenderAvatar = (message: ChatMessage) => {
    if (message.senderId === user?.id) {
      return user?.profilePicture || "";
    }
    if (creatorUser?.id === message.senderId) {
      return creatorUser.profilePicture || "";
    }
    if (consultantProfile?.user.id === message.senderId) {
      return consultantProfile.user.profilePicture || "";
    }
    return "";
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="flex flex-col h-[80vh]">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Phòng chat: {chatQuestion.title}</span>
            <div className="flex items-center gap-2">
              <WebSocketStatus />
              <Badge>
                {chatQuestion.status === "pending" && "Chờ trả lời"}
                {chatQuestion.status === "answered" && "Đã trả lời"}
                {chatQuestion.status === "closed" && "Đã đóng"}
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Người tạo: {creatorUser?.firstName} {creatorUser?.lastName || "N/A"}
            {consultantProfile && (
              <>
                <br />
                Tư vấn viên: {consultantProfile.user.firstName}{" "}
                {consultantProfile.user.lastName}
              </>
            )}
            {appointmentDetails && (
              <>
                <br />
                Cuộc hẹn:{" "}
                {format(
                  new Date(appointmentDetails.appointmentDate),
                  "dd/MM/yyyy HH:mm",
                  { locale: vi }
                )}
              </>
            )}
            <br />
            Ngày tạo:{" "}
            {format(new Date(chatQuestion.createdAt), "dd/MM/yyyy HH:mm", {
              locale: vi,
            })}
          </p>
        </CardHeader>

        {connectionError && (
          <Alert className="mx-4 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        <CardContent className="flex-1 overflow-hidden p-4">
          <ScrollArea className="h-full pr-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 mb-4 ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={getSenderAvatar(message)}
                        alt={getSenderName(message)}
                      />
                      <AvatarFallback>
                        {getSenderName(message).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      isCurrentUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {getSenderName(message)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), "HH:mm", {
                          locale: vi,
                        })}
                      </span>
                    </div>
                    {message.type === "text" && (
                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser ? "bg-blue-500 text-white" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                    )}
                    {message.type === "image" && (
                      <div className="relative group">
                        <img
                          src={message.fileUrl}
                          alt="Image message"
                          className="max-w-xs max-h-48 rounded-lg object-contain cursor-pointer"
                          onClick={() => window.open(message.fileUrl, "_blank")}
                        />
                        {isCurrentUser && message.isRead && (
                          <span className="absolute bottom-1 right-1 text-xs text-gray-200">
                            Đã xem
                          </span>
                        )}
                      </div>
                    )}
                    {message.type === "file" && (
                      <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <Link
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadFile(
                              message.id,
                              message.content || "downloaded_file"
                            );
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {message.content || "Tệp đính kèm"}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDownloadFile(
                              message.id,
                              message.content || "downloaded_file"
                            )
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {message.isRead ? "Đã xem" : "Đã gửi"}
                      </span>
                    )}
                  </div>
                  {isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={getSenderAvatar(message)}
                        alt={getSenderName(message)}
                      />
                      <AvatarFallback>
                        {getSenderName(message).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4 flex flex-col">
          {typingUsers.size > 0 && (
            <div className="w-full text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {Array.from(typingUsers).join(", ")} đang nhập...
            </div>
          )}
          <div className="flex w-full items-center gap-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || !socketConnected}
              title="Gửi tệp"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              placeholder={
                socketConnected ? "Nhập tin nhắn..." : "Đang kết nối..."
              }
              className="flex-1 resize-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isSending || !socketConnected}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !socketConnected || !newMessage.trim()}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatRoom;
