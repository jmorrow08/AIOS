import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pen,
  Square,
  Type,
  Image as ImageIcon,
  Eraser,
  Undo,
  Redo,
  Trash2,
  Download,
  Users,
  MessageCircle,
  Settings,
  Plus,
  Save,
  Circle,
  Minus,
  Palette,
  MinusIcon,
  PlusIcon,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  CanvasRenderer,
  DrawingPath,
  Shape,
  TextElement,
  ImageElement,
  Point,
  createTextInput,
  loadImage,
} from '@/utils/canvasUtils';
import { generateWhiteboardSOP, WhiteboardSOPRequest } from '@/agents/sopBot';

interface WhiteboardElement {
  id: string;
  sessionId: string;
  userId: string;
  type: 'shape' | 'text' | 'drawing' | 'image';
  data: any;
  layerOrder: number;
  createdAt: string;
  isDeleted: boolean;
}

interface Participant {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { x: number; y: number };
  isOnline: boolean;
}

interface WhiteboardSession {
  id: string;
  title: string;
  participants: Participant[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

type Tool = 'pen' | 'shape' | 'text' | 'image' | 'eraser' | 'select';
type ShapeType = 'rectangle' | 'circle' | 'line';

const Whiteboard: React.FC = () => {
  const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [session, setSession] = useState<WhiteboardSession | null>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('pen');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rectangle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('New Whiteboard Session');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(2);
  const [showAISOPModal, setShowAISOPModal] = useState(false);
  const [sopRequest, setSopRequest] = useState<WhiteboardSOPRequest>({
    topic: '',
    audience: 'employee',
    format: 'outline',
    maxLength: 500,
  });
  const [isGeneratingSOP, setIsGeneratingSOP] = useState(false);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        rendererRef.current = new CanvasRenderer(canvas);
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw canvas when elements change
  const redrawCanvas = useCallback(() => {
    if (!rendererRef.current) return;

    rendererRef.current.clear();

    elements.forEach((element) => {
      switch (element.type) {
        case 'drawing':
          const path: DrawingPath = {
            points: element.data.path,
            color: element.data.color,
            lineWidth: element.data.lineWidth,
          };
          rendererRef.current!.drawPath(path);
          break;

        case 'shape':
          const shape: Shape = element.data;
          rendererRef.current!.drawShape(shape);
          break;

        case 'text':
          const textElement: TextElement = element.data;
          rendererRef.current!.drawText(textElement);
          break;

        case 'image':
          const imageElement: ImageElement = element.data;
          const img = new Image();
          img.onload = () => {
            if (rendererRef.current) {
              rendererRef.current.drawImage(imageElement, img);
            }
          };
          img.src = imageElement.url;
          break;
      }
    });
  }, [elements]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Load or create session
  useEffect(() => {
    if (!user) return;

    const initializeSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');

      if (sessionId) {
        // Load existing session
        const { data, error } = await supabase
          .from('whiteboard_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (data && !error) {
          setSession(data);
          setSessionTitle(data.title);
        }
      } else {
        // Create new session
        const { data, error } = await supabase
          .from('whiteboard_sessions')
          .insert({
            title: sessionTitle,
            created_by: user.id,
            participants: [
              {
                id: user.id,
                name: user.user_metadata?.full_name || 'Anonymous',
                color: '#3b82f6',
                isOnline: true,
              },
            ],
          })
          .select()
          .single();

        if (data && !error) {
          setSession(data);
          // Update URL
          window.history.pushState({}, '', `?sessionId=${data.id}`);
        }
      }
    };

    initializeSession();
  }, [user, sessionTitle]);

  // Real-time subscriptions
  useEffect(() => {
    if (!session) return;

    // Subscribe to whiteboard elements changes
    const elementsSubscription = supabase
      .channel(`whiteboard_elements_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_elements',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newElement = payload.new as any;
          if (newElement.user_id !== user?.id) {
            // Don't duplicate our own elements
            setElements((prev) => [
              ...prev,
              {
                id: newElement.id,
                sessionId: newElement.session_id,
                userId: newElement.user_id,
                type: newElement.type,
                data: newElement.data,
                layerOrder: newElement.layer_order,
                createdAt: newElement.created_at,
                isDeleted: false,
              },
            ]);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboard_elements',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const updatedElement = payload.new as any;
          setElements((prev) =>
            prev.map((el) =>
              el.id === updatedElement.id
                ? { ...el, data: updatedElement.data, isDeleted: updatedElement.is_deleted }
                : el,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'whiteboard_elements',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const deletedElement = payload.old as any;
          setElements((prev) => prev.filter((el) => el.id !== deletedElement.id));
        },
      )
      .subscribe();

    // Subscribe to session participants changes
    const sessionSubscription = supabase
      .channel(`whiteboard_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboard_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as any;
          setSession(updatedSession);
          setParticipants(updatedSession.participants || []);
        },
      )
      .subscribe();

    // Subscribe to chat messages
    const chatSubscription = supabase
      .channel(`chat_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collab_messages',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          setChatMessages((prev) => [...prev, newMessage]);
        },
      )
      .subscribe();

    // Load existing elements
    const loadExistingElements = async () => {
      const { data, error } = await supabase
        .from('whiteboard_elements')
        .select('*')
        .eq('session_id', session.id)
        .eq('is_deleted', false)
        .order('layer_order');

      if (data && !error) {
        setElements(
          data.map((el) => ({
            id: el.id,
            sessionId: el.session_id,
            userId: el.user_id,
            type: el.type,
            data: el.data,
            layerOrder: el.layer_order,
            createdAt: el.created_at,
            isDeleted: false,
          })),
        );
      }
    };

    // Load existing chat messages
    const loadExistingMessages = async () => {
      const { data, error } = await supabase
        .from('collab_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at');

      if (data && !error) {
        setChatMessages(data);
      }
    };

    loadExistingElements();
    loadExistingMessages();

    // Track user presence
    const presenceChannel = supabase.channel(`presence_${session.id}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        // Update participants online status
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            isOnline: Object.keys(newState).includes(p.id),
          })),
        );
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            name: user.user_metadata?.full_name || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      elementsSubscription.unsubscribe();
      sessionSubscription.unsubscribe();
      chatSubscription.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [session, user]);

  // Track cursor position
  useEffect(() => {
    if (!session || !user) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!rendererRef.current) return;

      const point = rendererRef.current.getMousePosition(e as any);

      // Update cursor position in session participants
      const updatedParticipants = participants.map((p) =>
        p.id === user.id ? { ...p, cursorPosition: point } : p,
      );
      setParticipants(updatedParticipants);

      // Broadcast cursor position to other users
      supabase.channel(`cursor_${session.id}`).send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: user.id,
          position: point,
        },
      });
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, [session, user, participants]);

  // Listen for cursor broadcasts
  useEffect(() => {
    if (!session) return;

    const cursorChannel = supabase
      .channel(`cursor_${session.id}`)
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === payload.userId ? { ...p, cursorPosition: payload.position } : p,
            ),
          );
        }
      })
      .subscribe();

    return () => {
      cursorChannel.unsubscribe();
    };
  }, [session, user]);

  // Drawing handlers
  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rendererRef.current || !session) return;

      const point = rendererRef.current.getMousePosition(e);
      setIsDrawing(true);

      switch (selectedTool) {
        case 'pen':
          setCurrentPath([point]);
          break;

        case 'shape':
          const newShape: Shape = {
            type: selectedShapeType,
            startPoint: point,
            endPoint: point,
            color: selectedColor,
            lineWidth: lineWidth,
          };
          setCurrentShape(newShape);
          break;

        case 'text':
          // Handle text input creation
          createTextInput(
            point,
            async (text) => {
              if (text.trim()) {
                const textElement: TextElement = {
                  position: point,
                  text: text.trim(),
                  fontSize: 16,
                  color: selectedColor,
                };

                await saveElement('text', textElement);
              }
            },
            () => {}, // Cancel callback
          );
          break;

        case 'image':
          // Handle image upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
              await handleImageUpload(file, point);
            }
          };
          input.click();
          break;
      }
    },
    [selectedTool, selectedShapeType, selectedColor, lineWidth, session],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !rendererRef.current) return;

      const point = rendererRef.current.getMousePosition(e);

      switch (selectedTool) {
        case 'pen':
          setCurrentPath((prev) => {
            const newPath = [...prev, point];
            // Draw current path in real-time
            if (newPath.length > 1 && rendererRef.current) {
              const path: DrawingPath = {
                points: newPath,
                color: selectedColor,
                lineWidth: lineWidth,
              };
              redrawCanvas(); // Clear and redraw
              rendererRef.current.drawPath(path);
            }
            return newPath;
          });
          break;

        case 'shape':
          if (currentShape) {
            const updatedShape = { ...currentShape, endPoint: point };
            setCurrentShape(updatedShape);
            redrawCanvas(); // Clear and redraw existing elements
            rendererRef.current.drawShape(updatedShape);
          }
          break;
      }
    },
    [isDrawing, selectedTool, currentShape, selectedColor, lineWidth, redrawCanvas],
  );

  const stopDrawing = useCallback(async () => {
    if (!isDrawing || !session) return;

    setIsDrawing(false);

    switch (selectedTool) {
      case 'pen':
        if (currentPath.length > 1) {
          const path: DrawingPath = {
            points: currentPath,
            color: selectedColor,
            lineWidth: lineWidth,
          };
          await saveElement('drawing', path);
        }
        setCurrentPath([]);
        break;

      case 'shape':
        if (
          currentShape &&
          currentShape.startPoint.x !== currentShape.endPoint.x &&
          currentShape.startPoint.y !== currentShape.endPoint.y
        ) {
          await saveElement('shape', currentShape);
        }
        setCurrentShape(null);
        break;
    }
  }, [isDrawing, selectedTool, currentPath, currentShape, selectedColor, lineWidth, session]);

  // Helper function to save elements
  const saveElement = async (type: string, data: any) => {
    if (!session || !user) return;

    const elementData = {
      session_id: session.id,
      user_id: user.id,
      type,
      data,
      layer_order: elements.length,
    };

    const { data: savedElement, error } = await supabase
      .from('whiteboard_elements')
      .insert(elementData)
      .select()
      .single();

    if (!error && savedElement) {
      setElements((prev) => [
        ...prev,
        {
          id: savedElement.id,
          sessionId: session.id,
          userId: user.id,
          type: type as any,
          data,
          layerOrder: elementData.layer_order,
          createdAt: savedElement.created_at,
          isDeleted: false,
        },
      ]);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File, position: Point) => {
    if (!session || !user) return;

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `whiteboard/${session.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-assets').getPublicUrl(filePath);

      const imageElement: ImageElement = {
        position,
        width: 200,
        height: 200,
        url: publicUrl,
        fileName: file.name,
      };

      await saveElement('image', imageElement);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // Export functions
  const exportAsPNG = async () => {
    if (!rendererRef.current || !session) return;

    try {
      const dataURL = rendererRef.current.exportToDataURL();
      const blob = await rendererRef.current.exportToBlob();

      if (blob) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whiteboard-${session.title}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Upload to Supabase Storage
        const fileName = `whiteboard-export-${Date.now()}.png`;
        const filePath = `whiteboard/${session.id}/exports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media-assets')
          .upload(filePath, blob);

        if (!uploadError) {
          console.log('PNG exported and saved to storage');
        }
      }
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  };

  const exportAsJSON = async () => {
    if (!session) return;

    try {
      const exportData = {
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          participants: session.participants,
        },
        elements: elements,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard-${session.title}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Upload to Supabase Storage
      const fileName = `whiteboard-export-${Date.now()}.json`;
      const filePath = `whiteboard/${session.id}/exports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(filePath, blob);

      if (!uploadError) {
        console.log('JSON exported and saved to storage');
      }

      // Also save to Knowledge Library
      await saveToKnowledgeLibrary(exportData, blob);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const saveToKnowledgeLibrary = async (exportData: any, jsonBlob: Blob) => {
    if (!session || !user) return;

    try {
      const fileName = `whiteboard-${session.title}-${Date.now()}.json`;
      const filePath = `knowledge/whiteboard/${session.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, jsonBlob);

      if (!uploadError) {
        // Save document metadata to knowledge_documents table
        const { error: dbError } = await supabase.from('documents').insert({
          title: `Whiteboard Export: ${session.title}`,
          file_path: filePath,
          file_type: 'application/json',
          file_size: jsonBlob.size,
          uploaded_by: user.id,
          tags: ['whiteboard', 'export', session.id],
          metadata: {
            whiteboard_session_id: session.id,
            element_count: elements.length,
            exported_at: new Date().toISOString(),
          },
        });

        if (!dbError) {
          console.log('Whiteboard saved to Knowledge Library');
        }
      }
    } catch (error) {
      console.error('Error saving to Knowledge Library:', error);
    }
  };

  const clearCanvas = async () => {
    if (!session || !user || !rendererRef.current) return;

    const confirmClear = window.confirm(
      'Are you sure you want to clear the entire whiteboard? This action cannot be undone.',
    );
    if (!confirmClear) return;

    try {
      // Mark all elements as deleted
      const { error } = await supabase
        .from('whiteboard_elements')
        .update({ is_deleted: true })
        .eq('session_id', session.id)
        .eq('is_deleted', false);

      if (!error) {
        setElements([]);
        rendererRef.current.clear();
      }
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!newMessage.trim() || !session || !user) return;

    const message = {
      session_id: session.id,
      user_id: user.id,
      message: newMessage.trim(),
      user_name: user.user_metadata?.full_name || 'Anonymous',
    };

    const { error } = await supabase.from('collab_messages').insert(message);

    if (!error) {
      setNewMessage('');
    }
  };

  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'shape', icon: Square, label: 'Shape' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'ai', icon: Bot, label: 'AI SOP' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  // Generate and place SOP content on whiteboard
  const generateAndPlaceSOP = async () => {
    if (!user) return;

    setIsGeneratingSOP(true);
    try {
      const response = await generateWhiteboardSOP({
        ...sopRequest,
        userId: user.id,
      });

      if (response.success && response.content) {
        // Place the generated content as a text element on the canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const position = {
            x: rect.width / 2 - 150, // Center horizontally
            y: rect.height / 2 - 100, // Center vertically
          };

          const textElement: TextElement = {
            position,
            text: `${response.title}\n\n${response.content}`,
            fontSize: 14,
            color: selectedColor,
          };

          await saveElement('text', textElement);
        }

        setShowAISOPModal(false);
        setSopRequest({
          topic: '',
          audience: 'employee',
          format: 'outline',
          maxLength: 500,
        });
      } else {
        alert(`Failed to generate SOP: ${response.error}`);
      }
    } catch (error) {
      console.error('Error generating SOP:', error);
      alert('Failed to generate SOP. Please try again.');
    } finally {
      setIsGeneratingSOP(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Whiteboard</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <Input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="mt-2 bg-slate-700 border-slate-600 text-white"
              placeholder="Session title"
            />
          </div>

          {/* Participants */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Participants</span>
              <Badge variant="secondary" className="text-xs">
                {participants.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: participant.color }}
                  />
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-300">{participant.name}</span>
                  {participant.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">Chat</span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {msg.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">
                          {msg.user_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-white">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-0 h-8 bg-slate-700 border-slate-600 text-white resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-slate-800 border-b border-slate-700 p-2">
          <div className="flex items-center gap-2">
            {!showSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="mr-2"
              >
                <Users className="w-4 h-4" />
              </Button>
            )}

            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (tool.id === 'ai') {
                      setShowAISOPModal(true);
                    } else {
                      setSelectedTool(tool.id as Tool);
                    }
                  }}
                  className="w-10 h-10 p-0"
                  title={tool.label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}

            {/* Shape type selector when shape tool is selected */}
            {selectedTool === 'shape' && (
              <>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button
                  variant={selectedShapeType === 'rectangle' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedShapeType('rectangle')}
                  className="w-10 h-10 p-0"
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedShapeType === 'circle' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedShapeType('circle')}
                  className="w-10 h-10 p-0"
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedShapeType === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedShapeType('line')}
                  className="w-10 h-10 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </>
            )}

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Color picker */}
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-slate-400" />
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-600 cursor-pointer"
              />
            </div>

            {/* Line width controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
                className="w-6 h-6 p-0"
              >
                <MinusIcon className="w-3 h-3" />
              </Button>
              <span className="text-xs text-slate-400 min-w-[20px] text-center">{lineWidth}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLineWidth(Math.min(20, lineWidth + 1))}
                className="w-6 h-6 p-0"
              >
                <PlusIcon className="w-3 h-3" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-2" />

            <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
              <Redo className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0"
              onClick={clearCanvas}
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0"
              onClick={exportAsJSON}
              title="Export as JSON"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0"
              onClick={exportAsPNG}
              title="Export as PNG"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* Participant cursors would go here */}
          {participants.map(
            (participant) =>
              participant.cursorPosition && (
                <div
                  key={participant.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: participant.cursorPosition.x,
                    top: participant.cursorPosition.y,
                    transform: 'translate(-2px, -2px)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: participant.color }}
                  />
                  <div className="absolute top-5 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {participant.name}
                  </div>
                </div>
              ),
          )}
        </div>
      </div>

      {/* AI SOP Generation Modal */}
      <Dialog open={showAISOPModal} onOpenChange={setShowAISOPModal}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              Generate SOP with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic" className="text-slate-300">
                Topic/Process
              </Label>
              <Input
                id="topic"
                placeholder="e.g., Customer onboarding, Data backup, Quality control..."
                value={sopRequest.topic}
                onChange={(e) => setSopRequest((prev) => ({ ...prev, topic: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience" className="text-slate-300">
                  Target Audience
                </Label>
                <Select
                  value={sopRequest.audience}
                  onValueChange={(value: 'employee' | 'client' | 'agent') =>
                    setSopRequest((prev) => ({ ...prev, audience: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="employee" className="text-white">
                      Employee
                    </SelectItem>
                    <SelectItem value="client" className="text-white">
                      Client
                    </SelectItem>
                    <SelectItem value="agent" className="text-white">
                      Agent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format" className="text-slate-300">
                  Format
                </Label>
                <Select
                  value={sopRequest.format}
                  onValueChange={(value: 'outline' | 'steps' | 'bullet_points') =>
                    setSopRequest((prev) => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="outline" className="text-white">
                      Outline
                    </SelectItem>
                    <SelectItem value="steps" className="text-white">
                      Numbered Steps
                    </SelectItem>
                    <SelectItem value="bullet_points" className="text-white">
                      Bullet Points
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="maxLength" className="text-slate-300">
                Maximum Length: {sopRequest.maxLength} characters
              </Label>
              <input
                type="range"
                id="maxLength"
                min="200"
                max="2000"
                step="100"
                value={sopRequest.maxLength}
                onChange={(e) =>
                  setSopRequest((prev) => ({ ...prev, maxLength: parseInt(e.target.value) }))
                }
                className="w-full mt-2"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowAISOPModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={generateAndPlaceSOP}
                disabled={!sopRequest.topic.trim() || isGeneratingSOP}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingSOP ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate SOP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Whiteboard;
