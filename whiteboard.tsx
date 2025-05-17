import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Save, Undo, Square, Circle as CircleIcon, Scale, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [tool, setTool] = useState<"pen" | "rectangle" | "circle" | "scale">("pen");
  const [scale, setScale] = useState(1);
  const { toast } = useToast();
  const startPointRef = useRef<{x: number, y: number}>({x: 0, y: 0});

  // Colors for the palette
  const colors = [
    "#000000", // Black
    "#FF0000", // Red
    "#0000FF", // Blue
    "#008000", // Green
    "#FFA500", // Orange
    "#800080", // Purple
    "#FF69B4", // Pink
    "#A52A2A", // Brown
    "#FFFFFF", // White
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      // Make the canvas much larger - take up more vertical and horizontal space
      canvas.width = parent.clientWidth;
      canvas.height = window.innerHeight * 0.85; // Increased from 0.75 to 0.85 for larger height
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Set default styles
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      
      // Fill with white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      setContext(ctx);
      
      // Save initial state
      saveToHistory(ctx);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Update context when color or brush size changes
  useEffect(() => {
    if (context) {
      context.strokeStyle = color;
      context.lineWidth = brushSize * scale;
    }
  }, [color, brushSize, context, scale]);

  const saveToHistory = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, imageData]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    
    // Get canvas position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    startPointRef.current = { x, y };
    
    if (tool === "pen") {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    // Get canvas position
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    if (tool === "pen") {
      context.lineTo(x, y);
      context.stroke();
    } else if (tool === "rectangle" || tool === "circle" || tool === "scale") {
      // Clear the canvas to the last saved state to avoid multiple shapes being drawn
      const lastState = history[history.length - 1];
      if (lastState) {
        context.putImageData(lastState, 0, 0);
      }
      
      const startX = startPointRef.current.x;
      const startY = startPointRef.current.y;
      
      if (tool === "rectangle") {
        context.beginPath();
        context.rect(startX, startY, x - startX, y - startY);
        context.stroke();
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        context.beginPath();
        context.arc(startX, startY, radius, 0, 2 * Math.PI);
        context.stroke();
      } else if (tool === "scale") {
        // Draw a scale line with markers
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(x, y);
        context.stroke();
        
        // Add small tick marks along the line
        const length = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        const angle = Math.atan2(y - startY, x - startX);
        const segmentCount = 10;
        const segmentLength = length / segmentCount;
        
        for (let i = 0; i <= segmentCount; i++) {
          const tickX = startX + Math.cos(angle) * (i * segmentLength);
          const tickY = startY + Math.sin(angle) * (i * segmentLength);
          
          context.beginPath();
          context.arc(tickX, tickY, 2, 0, 2 * Math.PI);
          context.fill();
        }
      }
    }
  };

  const endDrawing = () => {
    if (!isDrawing || !context) return;
    
    if (tool === "pen") {
      context.closePath();
    }
    setIsDrawing(false);
    
    // Save state to history
    saveToHistory(context);
  };

  const handleUndo = () => {
    if (history.length <= 1 || !context) return;
    
    // Remove the latest state
    const newHistory = [...history];
    newHistory.pop();
    
    // Use the previous state
    const previousState = newHistory[newHistory.length - 1];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    context.putImageData(previousState, 0, 0);
    setHistory(newHistory);
    
    toast({
      title: "Undo",
      description: "Previous action undone",
    });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png");
      
      // Create a temporary link element
      const link = document.createElement("a");
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Saved!",
        description: "Your whiteboard has been downloaded as a PNG image",
      });
    } catch (error) {
      console.error("Error saving canvas:", error);
      toast({
        title: "Error",
        description: "Could not save the whiteboard",
        variant: "destructive",
      });
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;
    
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save the cleared state to history
    saveToHistory(context);
    
    toast({
      title: "Canvas cleared",
      description: "Your whiteboard has been reset",
    });
  };

  return (
    <div className="container mx-auto py-4 px-2 max-w-[95%]"> {/* Increased container max width */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Whiteboard</h1>
      <p className="text-gray-600 mb-4">A digital space for drawing, brainstorming, and planning</p>
      
      <Card className="p-3 mb-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Label htmlFor="brush-size" className="block mb-1 text-sm">Brush Size</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs">{brushSize}</span>
                <Slider
                  value={[brushSize]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => setBrushSize(value[0])}
                  className="w-24 md:w-32"
                />
                <span className="text-xs">20</span>
              </div>
            </div>
            
            <div>
              <Label className="block mb-1 text-sm">Tools</Label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={tool === "pen" ? "default" : "outline"} 
                  onClick={() => setTool("pen")}
                  className="h-9 w-9 p-0"
                >
                  ✏️
                </Button>
                <Button 
                  size="sm" 
                  variant={tool === "rectangle" ? "default" : "outline"} 
                  onClick={() => setTool("rectangle")}
                  className="h-9 w-9 p-0"
                >
                  <Square size={16} />
                </Button>
                <Button 
                  size="sm" 
                  variant={tool === "circle" ? "default" : "outline"} 
                  onClick={() => setTool("circle")}
                  className="h-9 w-9 p-0"
                >
                  <CircleIcon size={16} />
                </Button>
                <Button 
                  size="sm" 
                  variant={tool === "scale" ? "default" : "outline"} 
                  onClick={() => setTool("scale")}
                  className="h-9 w-9 p-0"
                >
                  <Scale size={16} />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="block mb-1 text-sm">Color</Label>
              <RadioGroup 
                value={color} 
                onValueChange={setColor}
                className="flex gap-1"
              >
                {colors.map((colorOption) => (
                  <div key={colorOption} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={colorOption}
                      id={`color-${colorOption}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`color-${colorOption}`}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 ${
                        color === colorOption ? "ring-2 ring-offset-2 ring-gray-400" : ""
                      }`}
                      style={{ backgroundColor: colorOption, border: colorOption === "#FFFFFF" ? "1px solid #e2e2e2" : "none" }}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-2"
              size="sm"
            >
              <Undo size={16} />
              Undo
            </Button>
            
            <Button variant="outline" onClick={handleClearCanvas} size="sm">
              Clear
            </Button>
            
            <Button onClick={handleSave} className="flex items-center gap-2" size="sm">
              <Save size={16} />
              Save
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="border rounded-lg bg-white overflow-hidden" style={{ minHeight: '80vh' }}> {/* Set minimum height to 80% of viewport height */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="touch-none w-full"
          style={{ cursor: tool === "pen" ? "crosshair" : tool === "rectangle" ? "crosshair" : tool === "circle" ? "crosshair" : "crosshair" }}
        />
      </div>
      
      <p className="text-center text-gray-500 mt-4">
        Click and drag to draw. Use the tools above to change colors, adjust brush size, or save your work.
      </p>
    </div>
  );
};

export default Whiteboard;
