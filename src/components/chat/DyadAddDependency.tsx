import type React from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { IpcClient } from "../../ipc/ipc_client";
import { useAtom, useAtomValue } from "jotai";
import { chatMessagesAtom, selectedChatIdAtom } from "../../atoms/chatAtoms";
import { useStreamChat } from "@/hooks/useStreamChat";
import {
  Package,
  ChevronsUpDown,
  ChevronsDownUp,
  Loader,
  ExternalLink,
  Download,
} from "lucide-react";
import { CodeHighlight } from "./CodeHighlight";

interface DyadAddDependencyProps {
  children?: ReactNode;
  node?: any;
  packages?: string;
}

export const DyadAddDependency: React.FC<DyadAddDependencyProps> = ({
  children,
  node,
}) => {
  // Extract package attribute from the node if available
  const packages = node?.properties?.packages?.split(" ") || "";
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedChatId = useAtomValue(selectedChatIdAtom);
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const { streamMessage, isStreaming } = useStreamChat();
  const [isContentVisible, setIsContentVisible] = useState(false);
  const hasChildren = !!children;

  const handleInstall = async () => {
    if (!packages || !selectedChatId) return;

    setIsInstalling(true);
    setError(null);
    try {
      const ipcClient = IpcClient.getInstance();

      await ipcClient.addDependency({
        chatId: selectedChatId,
        packages,
      });

      // Refresh the chat messages
      const chat = await IpcClient.getInstance().getChat(selectedChatId);
      setMessages(chat.messages);

      await streamMessage({
        prompt: `I've installed ${packages.join(", ")}. Keep going.`,
        chatId: selectedChatId,
      });
    } catch (err) {
      setError("There was an error installing this package.");

      const chat = await IpcClient.getInstance().getChat(selectedChatId);
      setMessages(chat.messages);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      className={`bg-(--background-lightest) dark:bg-gray-900 hover:bg-(--background-lighter) rounded-lg px-4 py-3 border my-2 ${
        hasChildren ? "cursor-pointer" : ""
      } ${isInstalling ? "border-amber-500" : "border-border"}`}
      onClick={
        hasChildren ? () => setIsContentVisible(!isContentVisible) : undefined
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-gray-600 dark:text-gray-400" />
          {packages.length > 0 && (
            <div className="text-gray-800 dark:text-gray-200 font-semibold text-base">
              <div className="font-normal">
                Do you want to install these packages?
              </div>{" "}
              <div className="flex flex-wrap gap-2 mt-2">
                {packages.map((p: string) => (
                  <span
                    className="cursor-pointer text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    key={p}
                    onClick={() => {
                      IpcClient.getInstance().openExternalUrl(
                        `https://www.npmjs.com/package/${p}`
                      );
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {isInstalling && (
            <div className="flex items-center text-amber-600 text-xs ml-2">
              <Loader size={14} className="mr-1 animate-spin" />
              <span>Installing...</span>
            </div>
          )}
        </div>
        {hasChildren && (
          <div className="flex items-center">
            {isContentVisible ? (
              <ChevronsDownUp
                size={20}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              />
            ) : (
              <ChevronsUpDown
                size={20}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              />
            )}
          </div>
        )}
      </div>

      {packages.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Make sure these packages are what you want.{" "}
        </div>
      )}

      {/* Show content if it's visible and has children */}
      {isContentVisible && hasChildren && (
        <div className="mt-2">
          <div className="text-xs">
            <CodeHighlight className="language-shell">{children}</CodeHighlight>
          </div>
        </div>
      )}

      {/* Always show install button if there are no children */}
      {packages.length > 0 && !hasChildren && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={(e) => {
              if (hasChildren) e.stopPropagation();
              handleInstall();
            }}
            disabled={isInstalling || isStreaming}
            size="default"
            variant="default"
            className="font-medium bg-primary/90 flex items-center gap-2 w-full max-w-sm py-4 mt-2 mb-2"
          >
            <Download size={16} />
            {isInstalling ? "Installing..." : "Install packages"}
          </Button>

          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
        </div>
      )}
    </div>
  );
};
