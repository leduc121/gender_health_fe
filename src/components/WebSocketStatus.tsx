"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getSocket } from "@/services/chat.service";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";

interface WebSocketStatusProps {
  showAlert?: boolean;
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showAlert = false,
  className = "",
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionError("Mất kết nối với máy chủ");
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setConnectionError("Không thể kết nối đến máy chủ");
    };

    // Set initial state
    setIsConnected(socket.connected);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  return (
    <div className={className}>
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Đang kết nối
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Mất kết nối
          </>
        )}
      </Badge>

      {showAlert && connectionError && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WebSocketStatus;
