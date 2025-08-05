"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ChatService, getSocket, resetSocket } from "@/services/chat.service";
import { Question } from "@/types/api.d";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

interface ChatQuestion extends Question {
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
}

const UserChatManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ChatService.getQuestions({
        search: searchTerm,
        page: 1,
        limit: 50,
      });
      setQuestions(response.data);
    } catch (error) {
      console.error("[UserChatManagement] Error fetching questions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chat. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, toast]);

  const createNewQuestion = async () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và nội dung câu hỏi.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingQuestion(true);
    try {
      const response = await ChatService.createQuestion({
        title: newQuestionTitle,
        content: newQuestionContent,
      });

      if (response.data) {
        toast({
          title: "Thành công",
          description: "Câu hỏi đã được tạo thành công.",
        });

        // Reset form
        setNewQuestionTitle("");
        setNewQuestionContent("");

        // Navigate to the new chat
        router.push(
          `/chat/${response.data.id}?title=${encodeURIComponent(response.data.title)}&content=${encodeURIComponent(response.data.content)}`
        );
      }
    } catch (error) {
      console.error("[UserChatManagement] Error creating question:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo câu hỏi. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  const handleQuestionClick = (question: ChatQuestion) => {
    router.push(`/chat/${question.id}`);
  };

  const getQuestionStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Chờ trả lời</Badge>;
      case "answered":
        return <Badge variant="default">Đã trả lời</Badge>;
      case "closed":
        return <Badge variant="destructive">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUnreadBadge = (unreadCount: number) => {
    if (unreadCount > 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          {unreadCount}
        </Badge>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    const socket = getSocket();

    const handleConnect = () => {
      console.log("[UserChatManagement] Socket connected");
      setSocketConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      console.log("[UserChatManagement] Socket disconnected");
      setSocketConnected(false);
      setConnectionError("Mất kết nối với máy chủ");
    };

    const handleConnectError = (error: any) => {
      console.error("[UserChatManagement] Socket connection error:", error);
      setSocketConnected(false);

      const errorMessage = error?.message || error.toString();
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("Unauthorized")
      ) {
        setConnectionError("Phiên đăng nhập đã hết hạn");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 3000);
      } else {
        setConnectionError("Không thể kết nối đến máy chủ");
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // Listen for new messages to update unread counts
    const cleanupNewMessage = ChatService.onNewMessage((message) => {
      setQuestions((prevQuestions) =>
        prevQuestions.map((question) => {
          if (question.id === message.questionId) {
            return {
              ...question,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
              },
              unreadCount:
                (question.unreadCount || 0) +
                (message.senderId !== user?.id ? 1 : 0),
            };
          }
          return question;
        })
      );
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      cleanupNewMessage();
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Quản lý chat
              <Badge variant={socketConnected ? "default" : "destructive"}>
                {socketConnected ? "Đang kết nối" : "Mất kết nối"}
              </Badge>
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo câu hỏi mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo câu hỏi mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề câu hỏi</Label>
                    <Input
                      id="title"
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      placeholder="Nhập tiêu đề câu hỏi..."
                      disabled={isCreatingQuestion}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Nội dung câu hỏi</Label>
                    <Textarea
                      id="content"
                      value={newQuestionContent}
                      onChange={(e) => setNewQuestionContent(e.target.value)}
                      placeholder="Mô tả chi tiết câu hỏi của bạn..."
                      rows={4}
                      disabled={isCreatingQuestion}
                    />
                  </div>
                  <Button
                    onClick={createNewQuestion}
                    disabled={
                      isCreatingQuestion ||
                      !newQuestionTitle.trim() ||
                      !newQuestionContent.trim()
                    }
                    className="w-full"
                  >
                    {isCreatingQuestion ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo câu hỏi"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {connectionError && (
          <Alert className="mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{connectionError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  resetSocket();
                  window.location.reload();
                }}
                className="ml-4"
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Chưa có câu hỏi nào
              </h3>
              <p className="text-muted-foreground mb-4">
                Bạn chưa có câu hỏi nào. Hãy tạo câu hỏi đầu tiên để bắt đầu
                chat.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo câu hỏi đầu tiên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo câu hỏi mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Tiêu đề câu hỏi</Label>
                      <Input
                        id="title"
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        placeholder="Nhập tiêu đề câu hỏi..."
                        disabled={isCreatingQuestion}
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Nội dung câu hỏi</Label>
                      <Textarea
                        id="content"
                        value={newQuestionContent}
                        onChange={(e) => setNewQuestionContent(e.target.value)}
                        placeholder="Mô tả chi tiết câu hỏi của bạn..."
                        rows={4}
                        disabled={isCreatingQuestion}
                      />
                    </div>
                    <Button
                      onClick={createNewQuestion}
                      disabled={
                        isCreatingQuestion ||
                        !newQuestionTitle.trim() ||
                        !newQuestionContent.trim()
                      }
                      className="w-full"
                    >
                      {isCreatingQuestion ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        "Tạo câu hỏi"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card
                  key={question.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleQuestionClick(question)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {question.title}
                          </h3>
                          {getQuestionStatusBadge(question.status)}
                          {getUnreadBadge(question.unreadCount || 0)}
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {question.content.length > 100
                            ? `${question.content.substring(0, 100)}...`
                            : question.content}
                        </p>
                        {question.lastMessage && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              Tin nhắn cuối: {question.lastMessage.content}
                            </span>
                            <span>•</span>
                            <span>
                              {format(
                                new Date(question.lastMessage.createdAt),
                                "dd/MM/yyyy HH:mm",
                                {
                                  locale: vi,
                                }
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <span>
                            Tạo lúc:{" "}
                            {format(
                              new Date(question.createdAt),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi }
                            )}
                          </span>
                        </div>
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {question.title.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserChatManagement;
