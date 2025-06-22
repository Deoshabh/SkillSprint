
"use client";

import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, X, Loader2, Bot, User } from 'lucide-react';
import { doubtSolver, type DoubtSolverInput } from '@/ai/flows/doubt-solver-flow';
import type { ChatMessage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const initialGreetingDone = useRef(false);

  useEffect(() => {
    if (isOpen && !initialGreetingDone.current && messages.length === 0) {
      setMessages([
        {
          id: `ai-greeting-${Date.now()}`,
          role: 'model',
          parts: [{ text: `Hi ${user?.name || 'there'}! I'm SkillSprint AI. How can I help you today?` }],
          timestamp: new Date(),
        },
      ]);
      initialGreetingDone.current = true;
    }
  }, [isOpen, user, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ text: query }],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyForFlow = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
      const input: DoubtSolverInput = { query, chatHistory: historyForFlow };
      const result = await doubtSolver(input);
      
      const aiResponseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        parts: [{ text: result.response }],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponseMessage]);
    } catch (error) {
      console.error("Error calling doubt solver flow:", error);
      const errorResponseMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        role: 'model',
        parts: [{ text: "Sorry, I encountered an error. Please try again later." }],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !initialGreetingDone.current) {
        // Reset greeting logic if chat is reopened and it wasn't shown
        // This is mainly if the very first open didn't trigger useEffect due to no messages
         setMessages([
            {
            id: `ai-greeting-${Date.now()}`,
            role: 'model',
            parts: [{ text: `Hi ${user?.name || 'there'}! I'm SkillSprint AI. How can I help you today?` }],
            timestamp: new Date(),
            },
        ]);
        initialGreetingDone.current = true;
    }
  };


  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={toggleChat}
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] max-h-[500px] shadow-xl z-40 flex flex-col bg-card border border-border animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg font-semibold">SkillSprint AI</CardTitle>
                    <CardDescription className="text-xs">Your Learning Assistant</CardDescription>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end space-x-2",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'model' && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                         <AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="h-4 w-4"/></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none prose prose-sm dark:prose-invert max-w-none" 
                      )}
                    >
                      <ReactMarkdown
                        components={{
                            p: ({node, ...props}) => <p className="mb-0" {...props} />, // Remove default margin from paragraphs in markdown
                        }}
                      >
                        {message.parts[0]?.text || ""}
                      </ReactMarkdown>
                    </div>
                     {message.role === 'user' && user && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{user.name.substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-end space-x-2 justify-start">
                     <Avatar className="h-7 w-7 flex-shrink-0">
                         <AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="h-4 w-4"/></AvatarFallback>
                      </Avatar>
                    <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm bg-muted text-muted-foreground rounded-bl-none">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" /> Typing...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask a question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 h-10"
                disabled={isLoading}
                autoFocus
              />
              <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading || !inputValue.trim()}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
